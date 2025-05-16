document.addEventListener('DOMContentLoaded', () => {
    // --- DEFINICIONES DE TRUCOS RECOMENDADOS (EJEMPLO) ---
    // Deberías expandir esto con tus trucos reales y sus costos base.
    // El 'cost' para powermoves es el costo de UNA repetición.
    const TRICK_DEFINITIONS = {
        freestyle: [
            { name: "Basic Jump", cost: 0.5, category: "freestyle" },
            { name: "Spin", cost: 1.0, category: "freestyle" },
        ],
        statics: [
            { name: "Handstand", cost: 1.5, category: "statics" },
            { name: "Planche Lean", cost: 2.0, category: "statics" },
            // Ejemplo de un supertruc
            { name: "Maltese (Supertruc)", cost: 5.0, category: "statics", isSuper: true, modifiers: [{ name: "Full", multiplier: 1.2 }], extraPoints: [{ name: "Perfect Hold (+1s)", value: 0.5 }] }
        ],
        powermoves: [
            { name: "Airflare", cost: 1.5, category: "powermoves" }, // Costo base por 1 rep
            { name: "Windmill", cost: 1.0, category: "powermoves" },
        ],
        balance: [
            { name: "One Arm Handstand", cost: 2.5, category: "balance" },
            { name: "Slackline Walk", cost: 1.8, category: "balance" },
        ]
    };

    // --- ESTADO GLOBAL DE LA APLICACIÓN ---
    let currentParticipant = 'A'; // 'A' o 'B'
    let participantScores = {
        A: { tricks: [], subtotals: { freestyle: 0, statics: 0, powermoves: 0, balance: 0, combos: 0 }, total: 0 },
        B: { tricks: [], subtotals: { freestyle: 0, statics: 0, powermoves: 0, balance: 0, combos: 0 }, total: 0 }
    };
    let currentActiveTab = 'freestyle'; // Pestaña activa por defecto
    let selectedRecommendedTrick = null; // Para guardar el truco recomendado seleccionado

    // --- SELECTORES DE ELEMENTOS DEL DOM ---
    const participantAButton = document.getElementById('participantA');
    const participantBButton = document.getElementById('participantB');
    const difficultySelect = document.getElementById('difficulty');

    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const tabContents = document.querySelectorAll('.tab-content');

    const recommendedTrickAddControlsSection = document.getElementById('recommendedTrickAddControlsSection');
    const addRecommendedTrickTitle = document.getElementById('addRecommendedTrickTitle');
    const selectedRecommendedTrickDisplay = document.getElementById('selectedRecommendedTrickDisplay');
    const cleanlinessRecommendedInput = document.getElementById('cleanlinessRecommended');
    const recommendedPowermoveRepsGroup = document.getElementById('recommendedPowermoveRepsGroup');
    const recommendedPowermoveRepsInput = document.getElementById('recommendedPowermoveReps');
    const addRecommendedTrickButton = document.getElementById('addRecommendedTrickButton');

    // Placeholders para controles de trucos recomendados en cada pestaña
    const freestyleControlsPlaceholder = document.getElementById('freestyleRecommendedControlsPlaceholder');
    const staticsControlsPlaceholder = document.getElementById('staticsRecommendedControlsPlaceholder');
    const powermovesControlsPlaceholder = document.getElementById('powermovesRecommendedControlsPlaceholder');
    const balanceControlsPlaceholder = document.getElementById('balanceRecommendedControlsPlaceholder');

    // Inputs y botones para Freestyle personalizado
    const customFreestyleTrickNameInput = document.getElementById('customFreestyleTrickName');
    const customFreestyleTrickCostInput = document.getElementById('customFreestyleTrickCost');
    const customFreestyleTrickCleanlinessInput = document.getElementById('customFreestyleTrickCleanliness');
    const addCustomFreestyleTrickButton = document.getElementById('addCustomFreestyleTrickButton');

    // Inputs y botones para Statics personalizado (similar a freestyle)
    const customStaticsTrickNameInput = document.getElementById('customStaticsTrickName');
    const customStaticsTrickCostInput = document.getElementById('customStaticsTrickCost');
    const customStaticsTrickCleanlinessInput = document.getElementById('customStaticsTrickCleanliness');
    const addCustomStaticsTrickButton = document.getElementById('addCustomStaticsTrickButton');
     // Controles de Modificadores de Statics (ejemplo, necesitarás populacion dinámica)
    const staticsModifiersSection = document.getElementById('staticsModifiersSection');
    const staticModifierSelect = document.getElementById('staticModifier');
    const staticExtraPointsSelect = document.getElementById('staticExtraPoints');
    const staticsSuperMessage = document.getElementById('staticsSuperMessage');
    const staticSuperExtraPointsSelect = document.getElementById('staticSuperExtraPoints');


    // Inputs y botones para PowerMoves personalizado
    const customPowermovesTrickNameInput = document.getElementById('customPowermovesTrickName');
    const customPowermovesTrickCostInput = document.getElementById('customPowermovesTrickCost'); // Costo base (1 rep)
    const customPowermovesTrickCleanlinessInput = document.getElementById('customPowermovesTrickCleanliness');
    const customPowermoveRepsInput = document.getElementById('customPowermoveReps');
    const addCustomPowermovesTrickButton = document.getElementById('addCustomPowermovesTrickButton');
    const pmMoreThan5RepsCheckbox = document.getElementById('pm_more_than_5_reps');

    // Inputs y botones para Balance personalizado (similar a freestyle)
    const customBalanceTrickNameInput = document.getElementById('customBalanceTrickName');
    const customBalanceTrickCostInput = document.getElementById('customBalanceTrickCost');
    const customBalanceTrickCleanlinessInput = document.getElementById('customBalanceTrickCleanliness');
    const addCustomBalanceTrickButton = document.getElementById('addCustomBalanceTrickButton');

    // Elementos de la pestaña Combos
    const comboCheckboxes = document.querySelectorAll('#tabContentCombos .custom-checkbox[data-category]');
    const applyComboPerfectionButton = document.getElementById('applyComboPerfection');
    const applyComboPenaltyButton = document.getElementById('applyComboPenalty');
    const calculateComboScoreButton = document.getElementById('calculateComboScore');
    const combosSubtotalSpan = document.getElementById('combosSubtotal');

    // Lista de trucos y totales
    const tricksListUL = document.getElementById('tricksList');
    const tricksCountSpan = document.getElementById('tricksCount');
    const totalScoreSpan = document.getElementById('totalScore');
    const clearAllTricksButton = document.getElementById('clearAllTricksButton');
    const saveParticipantScoreButton = document.getElementById('saveParticipantScoreButton');
    const currentParticipantIdDisplay = document.getElementById('currentParticipantIdDisplay');

    // Sección de resumen
    const scoreSummarySection = document.getElementById('scoreSummarySection');
    const summaryParticipantName = document.getElementById('summaryParticipantName');
    const scoreTableContainer = document.getElementById('scoreTableContainer');
    const downloadCsvButton = document.getElementById('downloadCsvButton');
    const judgeNextParticipantButton = document.getElementById('judgeNextParticipantButton');
    
    const toastNotification = document.getElementById('toastNotification');

    // --- INICIALIZACIÓN ---
    function initializeApp() {
        loadRecommendedTricks();
        setupEventListeners();
        updateParticipantDisplay();
        resetUIForParticipant(); // Para cargar el estado inicial o limpiar
        // Mover el panel de control al placeholder de la pestaña activa inicial
        moveRecommendedControlsToTab(currentActiveTab);
    }

    // --- MANEJO DE PARTICIPANTES ---
    function switchParticipant(newParticipant) {
        // Guardar estado del participante actual si es necesario
        // Por ahora, solo cambiamos y reseteamos la UI
        currentParticipant = newParticipant;
        updateParticipantDisplay();
        resetUIForParticipant();
        showToast(`Canviat a Participant ${currentParticipant}`, 'info');
    }

    function updateParticipantDisplay() {
        if (currentParticipant === 'A') {
            participantAButton.classList.add('active');
            participantBButton.classList.remove('active');
        } else {
            participantBButton.classList.add('active');
            participantAButton.classList.remove('active');
        }
        currentParticipantIdDisplay.textContent = currentParticipant;
    }

    function resetUIForParticipant() {
        // Limpiar lista de trucos
        tricksListUL.innerHTML = '<p class="no-tricks">Encara no s\'han afegit trucs.</p>';
        tricksCountSpan.textContent = '0';

        // Resetear subtotales en la UI y en el estado
        Object.keys(participantScores[currentParticipant].subtotals).forEach(area => {
            participantScores[currentParticipant].subtotals[area] = 0;
            const subtotalSpan = document.getElementById(`${area}Subtotal`);
            if (subtotalSpan) subtotalSpan.textContent = '0.00';
        });
        participantScores[currentParticipant].tricks = [];
        participantScores[currentParticipant].total = 0;
        totalScoreSpan.textContent = '0.00';

        // Resetear controles de combo
        comboCheckboxes.forEach(cb => cb.checked = false);
        resetComboBonusesAndPenalties();
        combosSubtotalSpan.textContent = '0.00';

        // Ocultar panel de trucos recomendados y resumen
        recommendedTrickAddControlsSection.style.display = 'none';
        scoreSummarySection.style.display = 'none';

        // Resetear campos de input personalizados (ejemplo para freestyle)
        customFreestyleTrickNameInput.value = '';
        customFreestyleTrickCostInput.value = '';
        customFreestyleTrickCleanlinessInput.value = '10';
        // ...hacer lo mismo para otros inputs personalizados...
        customPowermovesTrickNameInput.value = '';
        customPowermovesTrickCostInput.value = '';
        customPowermovesTrickCleanlinessInput.value = '10';
        customPowermoveRepsInput.value = '1';
        pmMoreThan5RepsCheckbox.checked = false;

        // Asegurarse de que el panel de control recomendado se mueva a la pestaña activa
        moveRecommendedControlsToTab(currentActiveTab);
    }


    // --- MANEJO DE PESTAÑAS (TABS) ---
    function moveRecommendedControlsToTab(tabName) {
        let placeholder;
        switch (tabName) {
            case 'freestyle': placeholder = freestyleControlsPlaceholder; break;
            case 'statics': placeholder = staticsControlsPlaceholder; break;
            case 'powermoves': placeholder = powermovesControlsPlaceholder; break;
            case 'balance': placeholder = balanceControlsPlaceholder; break;
            default: placeholder = null;
        }

        if (placeholder && recommendedTrickAddControlsSection.parentNode !== placeholder) {
            placeholder.appendChild(recommendedTrickAddControlsSection);
        }
        // Ocultar o mostrar campos específicos según la pestaña dentro de recommendedTrickAddControlsSection
        recommendedPowermoveRepsGroup.style.display = (tabName === 'powermoves') ? 'block' : 'none';
        staticsModifiersSection.style.display = (tabName === 'statics') ? 'block' : 'none'; // Mostrar/ocultar para Estáticos
        staticsSuperMessage.style.display = 'none'; // Ocultar mensaje de supertruc por defecto
    }


    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const tabName = trigger.dataset.tab;
            currentActiveTab = tabName;

            tabTriggers.forEach(t => t.classList.remove('active'));
            trigger.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                const contentTabName = content.id.replace('tabContent', '').toLowerCase();
                if (contentTabName === tabName) {
                    content.classList.add('active');
                }
            });
            
            moveRecommendedControlsToTab(tabName);
            selectedRecommendedTrick = null; // Deseleccionar truco al cambiar de pestaña
            recommendedTrickAddControlsSection.style.display = 'none'; // Ocultar panel al cambiar
        });
    });

    // --- CARGAR TRUCOS RECOMENDADOS ---
    function loadRecommendedTricks() {
        Object.keys(TRICK_DEFINITIONS).forEach(area => {
            const container = document.getElementById(`${area}RecommendedTricks`);
            if (container) {
                container.innerHTML = ''; // Limpiar
                TRICK_DEFINITIONS[area].forEach(trick => {
                    const button = document.createElement('button');
                    button.classList.add('button');
                    button.textContent = `${trick.name} (${trick.cost} pts)`;
                    if (trick.category === 'powermoves') {
                         button.textContent = `${trick.name} (${trick.cost} pts/rep)`;
                    }
                    button.addEventListener('click', () => handleRecommendedTrickSelection(trick));
                    container.appendChild(button);
                });
            }
        });
    }
    
    function handleRecommendedTrickSelection(trick) {
        selectedRecommendedTrick = trick;
        addRecommendedTrickTitle.textContent = `Afegir: ${trick.name}`;
        selectedRecommendedTrickDisplay.textContent = `Seleccionat: ${trick.name} (Cost base: ${trick.cost})`;
        cleanlinessRecommendedInput.value = '10'; // Reset cleanliness

        moveRecommendedControlsToTab(trick.category); // Asegura que los controles estén en la pestaña correcta

        // Lógica específica para Statics (Supertrucs y modificadores)
        if (trick.category === 'statics') {
            staticModifierSelect.innerHTML = ''; // Limpiar opciones
            staticExtraPointsSelect.innerHTML = '';

            if (trick.modifiers && trick.modifiers.length > 0) {
                trick.modifiers.forEach(mod => {
                    const option = document.createElement('option');
                    option.value = mod.multiplier;
                    option.textContent = `${mod.name} (x${mod.multiplier})`;
                    staticModifierSelect.appendChild(option);
                });
            } else {
                 staticModifierSelect.innerHTML = '<option value="1">Sense modificador</option>';
            }

            if (trick.extraPoints && trick.extraPoints.length > 0) {
                 trick.extraPoints.forEach(ep => {
                    const option = document.createElement('option');
                    option.value = ep.value;
                    option.textContent = `${ep.name} (+${ep.value}p)`;
                    staticExtraPointsSelect.appendChild(option);
                });
            } else {
                staticExtraPointsSelect.innerHTML = '<option value="0">Sense punts extra</option>';
            }
            
            if (trick.isSuper) {
                staticsSuperMessage.style.display = 'block';
                staticsSuperMessage.querySelector('p').textContent = `"${trick.name}" és un Supertruc! Pots afegir punts extra.`;
                // Poblar staticSuperExtraPointsSelect si es necesario
            } else {
                staticsSuperMessage.style.display = 'none';
            }
            staticsModifiersSection.style.display = 'block';
        } else {
            staticsModifiersSection.style.display = 'none';
            staticsSuperMessage.style.display = 'none';
        }


        recommendedTrickAddControlsSection.style.display = 'block'; // Mostrar el panel de control
    }


    // --- LÓGICA DE PUNTUACIÓN ---
    function getDifficultyMultiplier() {
        const difficulty = difficultySelect.value;
        if (difficulty === 'beginner') return 1.5;
        if (difficulty === 'professional') return 0.75;
        return 1.0; // Amateur
    }

    function calculateCleanlinessFactor(cleanliness) {
        return Math.max(0.1, Math.min(1, parseFloat(cleanliness) / 10));
    }

    // --- PUNTUACIÓN POWERMOVES ---
    function calculatePowermoveScore(baseCostPerRep, repetitions, cleanliness) {
        let points = 0;
        const cost = parseFloat(baseCostPerRep);
        const reps = parseInt(repetitions);

        if (isNaN(cost) || isNaN(reps) || cost <= 0 || reps <= 0) return 0;

        for (let i = 1; i <= reps; i++) {
            if (i <= 3) points += cost;
            else if (i === 4) points += cost * 0.80;
            else if (i === 5) points += cost * 0.60;
            // Reps > 5 no suman individualmente aquí, se maneja con el checkbox global
        }

        let finalScore = points * calculateCleanlinessFactor(cleanliness);
        
        if (pmMoreThan5RepsCheckbox.checked && reps > 5) {
            finalScore += 1; // Bonificación global
        }
        
        finalScore *= getDifficultyMultiplier();
        return parseFloat(finalScore.toFixed(2));
    }

    // --- PUNTUACIÓN COMBOS ---
    let comboState = { baseScore: 0, perfectionBonus: 0, penalty: 0 };

    function resetComboBonusesAndPenalties() {
        comboState.perfectionBonus = 0;
        comboState.penalty = 0;
        applyComboPerfectionButton.classList.remove('active'); // Opcional: feedback visual
        applyComboPenaltyButton.classList.remove('active'); // Opcional: feedback visual
    }
    
    function updateComboUIDisplay() {
        const totalComboPoints = comboState.baseScore + comboState.perfectionBonus - comboState.penalty;
        combosSubtotalSpan.textContent = Math.max(0, totalComboPoints).toFixed(2); // Evitar negativos para el subtotal UI
    }
    
    calculateComboScoreButton.addEventListener('click', () => {
        comboState.baseScore = 0;
        comboCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                comboState.baseScore += 1;
            }
        });
        updateComboUIDisplay();
        
        const finalComboScore = comboState.baseScore + comboState.perfectionBonus - comboState.penalty;
        if (finalComboScore !== 0) { // Solo añadir si hay puntos
             addTrickToParticipantList('combos', `Puntuació Combo (${getComboDetails()})`, Math.max(0, finalComboScore));
             updateSubtotal('combos', Math.max(0, finalComboScore)); // Actualiza el subtotal del participante
             showToast(`Combo afegit: ${Math.max(0, finalComboScore).toFixed(2)} punts`, 'success');
        } else {
            showToast(`No s'han assignat punts al combo.`, 'info');
        }

        // Resetear checkboxes y bonus/penalizaciones para el próximo combo
        comboCheckboxes.forEach(cb => cb.checked = false);
        resetComboBonusesAndPenalties();
        comboState.baseScore = 0; // Resetear base score también
        updateComboUIDisplay(); // Actualiza la UI a 0.00
    });

    function getComboDetails() {
        let details = [];
        comboCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                details.push(checkbox.labels[0].textContent.replace(/\(\+1p\)/,'').trim());
            }
        });
        if (comboState.perfectionBonus > 0) details.push("Perfecció");
        if (comboState.penalty > 0) details.push("N.Baixa");
        return details.length > 0 ? details.join(', ') : "General";
    }

    applyComboPerfectionButton.addEventListener('click', () => {
        if (comboState.perfectionBonus === 0) {
            comboState.perfectionBonus = 1;
            applyComboPerfectionButton.classList.add('active');
            showToast("Punt extra per perfecció aplicat! (+1p)", "success");
        } else {
            comboState.perfectionBonus = 0;
            applyComboPerfectionButton.classList.remove('active');
            showToast("Punt extra per perfecció eliminat.", "info");
        }
        updateComboUIDisplay();
    });

    applyComboPenaltyButton.addEventListener('click', () => {
        if (comboState.penalty === 0) {
            comboState.penalty = 0.5;
            applyComboPenaltyButton.classList.add('active');
            showToast("Penalització per neteja baixa aplicada. (-0.5p)", "error");
        } else {
            comboState.penalty = 0;
            applyComboPenaltyButton.classList.remove('active');
            showToast("Penalització per neteja baixa eliminada.", "info");
        }
        updateComboUIDisplay();
    });


    // --- AÑADIR TRUCOS (GENERAL) ---
    function addTrick(area, name, baseCost, cleanliness, reps = null) {
        let points = 0;
        let trickDetails = `${name}`;
        const difficultyMultiplier = getDifficultyMultiplier();

        if (area === 'powermoves') {
            points = calculatePowermoveScore(baseCost, reps, cleanliness); // La dificultad ya está en calculatePowermoveScore
            trickDetails += ` (${reps} reps, Neteja: ${cleanliness}/10)`;
        } else if (area === 'statics' && selectedRecommendedTrick && selectedRecommendedTrick.name === name) { // Truco estático recomendado
            let staticPoints = parseFloat(baseCost);
            const selectedMod = parseFloat(staticModifierSelect.value) || 1;
            const selectedExtra = parseFloat(staticExtraPointsSelect.value) || 0;
            // const selectedSuperExtra = parseFloat(staticSuperExtraPointsSelect.value) || 0; // Si se usa

            staticPoints = (staticPoints * selectedMod) + selectedExtra; // + selectedSuperExtra;
            points = staticPoints * calculateCleanlinessFactor(cleanliness) * difficultyMultiplier;
            trickDetails += ` (Neteja: ${cleanliness}/10, Mod: x${selectedMod}, Extra: +${selectedExtra}p)`;

        } else { // Freestyle, Balance, y custom Statics (sin modificadores complejos por ahora)
            points = parseFloat(baseCost) * calculateCleanlinessFactor(cleanliness) * difficultyMultiplier;
            trickDetails += ` (Neteja: ${cleanliness}/10)`;
        }
        
        points = parseFloat(points.toFixed(2));

        addTrickToParticipantList(area, trickDetails, points);
        updateSubtotal(area, points);
        showToast(`${area.charAt(0).toUpperCase() + area.slice(1)} afegit: ${name}`, 'success');
    }
    
    addRecommendedTrickButton.addEventListener('click', () => {
        if (!selectedRecommendedTrick) {
            showToast("Selecciona primer un truc recomanat.", "error");
            return;
        }
        const cleanliness = cleanlinessRecommendedInput.value;
        let reps = null;
        if (selectedRecommendedTrick.category === 'powermoves') {
            reps = recommendedPowermoveRepsInput.value;
        }
        
        addTrick(selectedRecommendedTrick.category, selectedRecommendedTrick.name, selectedRecommendedTrick.cost, cleanliness, reps);
        
        // Reset y ocultar panel
        selectedRecommendedTrick = null;
        recommendedTrickAddControlsSection.style.display = 'none';
        recommendedPowermoveRepsInput.value = '1'; // Reset reps
    });


    // --- AÑADIR TRUCOS PERSONALIZADOS (EJEMPLOS) ---
    addCustomFreestyleTrickButton.addEventListener('click', () => {
        const name = customFreestyleTrickNameInput.value.trim();
        const cost = customFreestyleTrickCostInput.value;
        const cleanliness = customFreestyleTrickCleanlinessInput.value;
        if (!name || !cost) { showToast("Nom i cost són requerits.", "error"); return; }
        addTrick('freestyle', name, cost, cleanliness);
        customFreestyleTrickNameInput.value = ''; customFreestyleTrickCostInput.value = '';
    });
    
    addCustomStaticsTrickButton.addEventListener('click', () => {
        const name = customStaticsTrickNameInput.value.trim();
        const cost = customStaticsTrickCostInput.value;
        const cleanliness = customStaticsTrickCleanlinessInput.value;
        if (!name || !cost) { showToast("Nom i cost són requerits.", "error"); return; }
        addTrick('statics', name, cost, cleanliness); // Sin modificadores para custom simple
        customStaticsTrickNameInput.value = ''; customStaticsTrickCostInput.value = '';
    });

    addCustomPowermovesTrickButton.addEventListener('click', () => {
        const name = customPowermovesTrickNameInput.value.trim();
        const baseCost = customPowermovesTrickCostInput.value; // Costo base por 1 rep
        const cleanliness = customPowermovesTrickCleanlinessInput.value;
        const reps = customPowermoveRepsInput.value;
        if (!name || !baseCost || !reps) { showToast("Nom, cost base i repeticions són requerits.", "error"); return; }
        addTrick('powermoves', name, baseCost, cleanliness, reps);
        customPowermovesTrickNameInput.value = ''; customPowermovesTrickCostInput.value = '';
        customPowermoveRepsInput.value = '1'; pmMoreThan5RepsCheckbox.checked = false;
    });
    
    addCustomBalanceTrickButton.addEventListener('click', () => {
        const name = customBalanceTrickNameInput.value.trim();
        const cost = customBalanceTrickCostInput.value;
        const cleanliness = customBalanceTrickCleanlinessInput.value;
        if (!name || !cost) { showToast("Nom i cost són requerits.", "error"); return; }
        addTrick('balance', name, cost, cleanliness);
        customBalanceTrickNameInput.value = ''; customBalanceTrickCostInput.value = '';
    });


    // --- GESTIÓN DE LISTA DE TRUCOS Y PUNTUACIÓN TOTAL ---
    function addTrickToParticipantList(area, description, points) {
        const participantData = participantScores[currentParticipant];
        const trickId = `trick-${Date.now()}-${Math.random()}`; // ID único para el truco
        participantData.tricks.push({ id: trickId, area, description, points });

        const listItem = document.createElement('li');
        listItem.dataset.trickId = trickId; // Guardar ID en el elemento
        listItem.innerHTML = `
            <div class="trick-info">
                <span class="trick-name">${description}</span>
                <span class="trick-details">${area.toUpperCase()} - ${points.toFixed(2)} pts</span>
            </div>
            <button class="button button-destructive small-btn remove-trick-btn">Eliminar</button>
        `;
        
        listItem.querySelector('.remove-trick-btn').addEventListener('click', () => {
            removeTrick(trickId, area, points);
        });
        
        const noTricksMessage = tricksListUL.querySelector('.no-tricks');
        if (noTricksMessage) noTricksMessage.remove();
        
        tricksListUL.appendChild(listItem);
        tricksCountSpan.textContent = participantData.tricks.length;
    }
    
    function removeTrick(trickId, area, pointsDeducted) {
        const participantData = participantScores[currentParticipant];
        participantData.tricks = participantData.tricks.filter(t => t.id !== trickId);

        const listItem = tricksListUL.querySelector(`li[data-trick-id="${trickId}"]`);
        if (listItem) listItem.remove();

        tricksCountSpan.textContent = participantData.tricks.length;
        if (participantData.tricks.length === 0) {
            tricksListUL.innerHTML = '<p class="no-tricks">Encara no s\'han afegit trucs.</p>';
        }

        updateSubtotal(area, -pointsDeducted); // Restar los puntos del subtotal y total
    }


    function updateSubtotal(area, pointsToAddOrSubtract) {
        const participantData = participantScores[currentParticipant];
        participantData.subtotals[area] = (participantData.subtotals[area] || 0) + pointsToAddOrSubtract;
        
        const subtotalSpan = document.getElementById(`${area}Subtotal`);
        if (subtotalSpan) {
            subtotalSpan.textContent = participantData.subtotals[area].toFixed(2);
        }
        updateTotalScore();
    }

    function updateTotalScore() {
        const participantData = participantScores[currentParticipant];
        participantData.total = 0;
        Object.values(participantData.subtotals).forEach(subtotal => {
            participantData.total += subtotal;
        });
        totalScoreSpan.textContent = participantData.total.toFixed(2);
    }
    
    clearAllTricksButton.addEventListener('click', () => {
        if (confirm(`Segur que vols eliminar tots els trucs del Participant ${currentParticipant}?`)) {
            resetUIForParticipant(); // Esto ya limpia los datos y la UI
            showToast(`Tots els trucs del Participant ${currentParticipant} eliminats.`, "info");
        }
    });

    // --- GUARDAR Y RESUMEN (LÓGICA BÁSICA) ---
    saveParticipantScoreButton.addEventListener('click', () => {
        showToast(`Puntuació del Participant ${currentParticipant} guardada (simulat): ${participantScores[currentParticipant].total.toFixed(2)} pts`, 'success');
        displayScoreSummary();
        scoreSummarySection.style.display = 'block';
        scoreSummarySection.scrollIntoView({ behavior: 'smooth' });
    });

    function displayScoreSummary() {
        summaryParticipantName.textContent = `Resum Participant ${currentParticipant}`;
        const data = participantScores[currentParticipant];
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Descripció</th>
                        <th>Àrea</th>
                        <th>Punts</th>
                    </tr>
                </thead>
                <tbody>`;
        
        data.tricks.forEach(trick => {
            tableHTML += `
                <tr>
                    <td>${trick.description}</td>
                    <td>${trick.area.toUpperCase()}</td>
                    <td>${trick.points.toFixed(2)}</td>
                </tr>`;
        });

        tableHTML += `
                </tbody>
                <tfoot>
                    <tr><td colspan="2"><strong>SUBTOTAL FREESTYLE</strong></td><td><strong>${data.subtotals.freestyle.toFixed(2)}</strong></td></tr>
                    <tr><td colspan="2"><strong>SUBTOTAL STATICS</strong></td><td><strong>${data.subtotals.statics.toFixed(2)}</strong></td></tr>
                    <tr><td colspan="2"><strong>SUBTOTAL POWERMOVES</strong></td><td><strong>${data.subtotals.powermoves.toFixed(2)}</strong></td></tr>
                    <tr><td colspan="2"><strong>SUBTOTAL BALANCE</strong></td><td><strong>${data.subtotals.balance.toFixed(2)}</strong></td></tr>
                    <tr><td colspan="2"><strong>SUBTOTAL COMBOS</strong></td><td><strong>${data.subtotals.combos.toFixed(2)}</strong></td></tr>
                    <tr class="grand-total"><td colspan="2"><strong>TOTAL GENERAL</strong></td><td><strong>${data.total.toFixed(2)}</strong></td></tr>
                </tfoot>
            </table>`;
        scoreTableContainer.innerHTML = tableHTML;
    }
    
    judgeNextParticipantButton.addEventListener('click', () => {
        scoreSummarySection.style.display = 'none'; // Ocultar resumen
        // Cambiar de participante (si solo hay A y B)
        const nextParticipant = (currentParticipant === 'A') ? 'B' : 'A';
        switchParticipant(nextParticipant);
    });
    
    downloadCsvButton.addEventListener('click', generateAndDownloadCSV);

    function generateAndDownloadCSV() {
        const data = participantScores[currentParticipant];
        if (data.tricks.length === 0 && data.total === 0) {
            showToast("No hi ha dades per descarregar.", "info");
            return;
        }

        let csvContent = "Participant;Descripcio;Area;Punts\r\n";
        data.tricks.forEach(trick => {
            csvContent += `${currentParticipant};"${trick.description.replace(/"/g, '""')}";${trick.area.toUpperCase()};${trick.points.toFixed(2)}\r\n`;
        });
        csvContent += "\r\n";
        csvContent += `SUBTOTAL FREESTYLE;;;${data.subtotals.freestyle.toFixed(2)}\r\n`;
        csvContent += `SUBTOTAL STATICS;;;${data.subtotals.statics.toFixed(2)}\r\n`;
        csvContent += `SUBTOTAL POWERMOVES;;;${data.subtotals.powermoves.toFixed(2)}\r\n`;
        csvContent += `SUBTOTAL BALANCE;;;${data.subtotals.balance.toFixed(2)}\r\n`;
        csvContent += `SUBTOTAL COMBOS;;;${data.subtotals.combos.toFixed(2)}\r\n`;
        csvContent += `TOTAL GENERAL;;;${data.total.toFixed(2)}\r\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `puntuacio_participant_${currentParticipant}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("CSV descarregat.", "success");
        } else {
            showToast("La descàrrega de CSV no és compatible amb aquest navegador.", "error");
        }
    }

    // --- NOTIFICACIONES TOAST ---
    function showToast(message, type = 'info') {
        if (!toastNotification) return;
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification show'; // Reset classes
        if (type === 'success') toastNotification.classList.add('success');
        else if (type === 'error') toastNotification.classList.add('error');
        else if (type === 'info') toastNotification.classList.add('info');

        setTimeout(() => {
            toastNotification.className = 'toast-notification';
        }, 3000);
    }
    
    // --- EVENT LISTENERS ADICIONALES ---
    function setupEventListeners() {
        participantAButton.addEventListener('click', () => switchParticipant('A'));
        participantBButton.addEventListener('click', () => switchParticipant('B'));
        // El listener de difficultySelect se usaría al calcular puntos
    }

    // --- INICIAR LA APP ---
    initializeApp();
});
