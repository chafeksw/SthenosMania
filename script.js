document.addEventListener('DOMContentLoaded', () => {
    // Definiciones de datos (igual que antes)
    const staticModifiers = [
        { name: "Tuck", value: 0.15 }, { name: "Tuck Adv", value: 0.3 },
        { name: "Una Pierna", value: 0.4 }, { name: "Straddle", value: 0.7 },
        { name: "Half", value: 0.8 }, { name: "Full", value: 1 },
    ];
    const extraPointOptions = [
        { name: "No Extra", value: 0 }, { name: "+0.25p", value: 0.25 },
        { name: "+0.5p", value: 0.5 },
    ];
    const baseStatics = {
        "Front Lever": 1, "Planche": 1.5, "Touch": 1.5, "Victorian": 1.25,
        "Flag": 0.75, "Back Lever": 0.75, "Maltese": 2.25, "SAT": 2.25, "Prayer Planche": 2,
    };
    const defaultTricksByTab = {
        freestyle: [
            { name: "360/Tornado", base: 1 }, { name: "Disloca 360", base: 1.25 },
            { name: "540", base: 1.5 }, { name: "Geinger", base: 1.5 },
            { name: "Pasavallas", base: 1.5 }, { name: "PasoFantasma", base: 1.75 },
            { name: "720 (Super)", base: 3 }, { name: "900 (Super)", base: 3 },
            { name: "1080 (Super)", base: 3 }, { name: "1240 (Super)", base: 3 },
            { name: "Regrab (Super)", base: 3 }, { name: "Super540 (Super)", base: 3 },
            { name: "Immortal (Super)", base: 3 },
        ],
        statics: [
            { name: "Front Lever", base: 1 }, { name: "Planche", base: 1.5 },
            { name: "Touch", base: 1.5 }, { name: "Victorian", base: 1.25 },
            { name: "Flag", base: 0.75 }, { name: "Back Lever", base: 0.75 },
            { name: "Maltese", base: 2.25 }, { name: "SAT", base: 2.25 },
            { name: "Prayer Planche", base: 2 },
            { name: "Victorian Cross (Super)", base: 3, isSuper: true },
            { name: "Reverse Planche (Super)", base: 3, isSuper: true },
            { name: "SAT Supino (Super)", base: 3, isSuper: true },
            { name: "Maltese (Avion) (Super)", base: 3, isSuper: true },
            { name: "One Arm Planche (Super)", base: 3, isSuper: true },
            { name: "Tiger Planche (Super)", base: 3, isSuper: true },
        ],
        powermoves: {
            empuje: {
                press: Object.keys(baseStatics).map(name => ({ name: `${name} Press`, staticBase: baseStatics[name], originalStatic: name })),
                pushup: Object.keys(baseStatics).map(name => ({ name: `${name} Push up`, staticBase: baseStatics[name], originalStatic: name })),
            },
            tiron: {
                raises: Object.keys(baseStatics).map(name => ({ name: `${name} Raise`, staticBase: baseStatics[name], originalStatic: name })),
                pullups: Object.keys(baseStatics).map(name => ({ name: `${name} Pull up`, staticBase: baseStatics[name], originalStatic: name })),
                press: Object.keys(baseStatics).map(name => ({ name: `${name} Press (Tirón)`, staticBase: baseStatics[name], originalStatic: name })),
            }
        },
        balance: [
            { name: "Handstand", base: 0.1 }, { name: "Handstand One Arm", base: 1.25 },
            { name: "One Arm Flag", base: 2 }, { name: "One Arm Planche", base: 2 },
            { name: "Dragon Planche", base: 1.75 }, { name: "One Arm Front Lever", base: 1.5 },
        ],
        combos: [],
    };
    const descriptions = {
        freestyle: "Creativitat, ús variat de moviments i originalitat. Màxim 10 punts.",
        statics: "Elements estàtics. Selecciona un modificador i extres. Màxim 10 punts.",
        powermoves: "Moviments explosius. La puntuació per repetició disminueix. Màxim 10 punts.",
        balance: "Moviments d'equilibri. Màxim 5 punts.",
        combos: "Puntua segons àmbits tocats i condicions. Màxim 10 punts.",
    };
    const maxScoresPerArea = {
        freestyle: 10, statics: 10, powermoves: 10, balance: 5, combos: 10,
    };

    // Estado de la aplicación
    let currentParticipant = "A";
    let difficulty = "amateur";
    let participantData = {
        A: { tricks: [], directScores: { combos: 0 }, comboAreas: { freestyle: false, statics: false, powermoves: false, balance: false }, comboUnbroken: false, pm_moreThan5Reps: false, difficulty: "amateur" },
        B: { tricks: [], directScores: { combos: 0 }, comboAreas: { freestyle: false, statics: false, powermoves: false, balance: false }, comboUnbroken: false, pm_moreThan5Reps: false, difficulty: "amateur" }
    };
    let savedScores = { A: null, B: null };

    let newTrickConfig = { name: "", base: 0, clean: 10, modifierValue: 1, extraPointsValue: 0, powerMoveDetails: {} };
    let currentTab = "freestyle";
    let selectedRecommendedTrickName = null;

    let selectedStaticModifier = staticModifiers.find(m => m.name === "Full").value;
    let selectedStaticExtra = 0;

    let pm_category = null;
    let pm_exercise = null;
    let pm_staticElement = null;
    let selectedPowerMoveModifier = staticModifiers.find(m => m.name === "Full").value;
    let selectedPowerMoveExtra = 0;

    // --- Elementos del DOM ---
    const participantAButton = document.getElementById('participantA');
    const participantBButton = document.getElementById('participantB');
    const difficultySelect = document.getElementById('difficulty');
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const tabContents = document.querySelectorAll('.tab-content');
    const totalScoreDisplay = document.getElementById('totalScore');
    const tricksListElement = document.getElementById('tricksList');
    const tricksCountElement = document.getElementById('tricksCount');
    const noTricksMessage = tricksListElement.querySelector('.no-tricks');
    const clearAllTricksButton = document.getElementById('clearAllTricksButton');

    // Controles para añadir trucos recomendados (sección movible)
    const recommendedTrickAddControlsSection = document.getElementById('recommendedTrickAddControlsSection');
    const addRecommendedTrickTitleElement = document.getElementById('addRecommendedTrickTitle');
    const selectedRecommendedTrickDisplayElement = document.getElementById('selectedRecommendedTrickDisplay');
    const cleanlinessRecommendedInput = document.getElementById('cleanlinessRecommended');
    const addRecommendedTrickButton = document.getElementById('addRecommendedTrickButton');
    
    const staticModifierSelect = document.getElementById('staticModifier');
    const staticExtraPointsSelect = document.getElementById('staticExtraPoints');
    const staticsModifiersSection = document.getElementById('staticsModifiersSection');
    const staticsSuperMessage = document.getElementById('staticsSuperMessage');
    const staticSuperExtraPointsSelect = document.getElementById('staticSuperExtraPoints');
    
    const saveParticipantScoreButton = document.getElementById('saveParticipantScoreButton');
    const currentParticipantIdDisplay = document.getElementById('currentParticipantIdDisplay');
    const scoreSummarySection = document.getElementById('scoreSummarySection');
    const summaryParticipantNameElement = document.getElementById('summaryParticipantName');
    const scoreTableContainer = document.getElementById('scoreTableContainer');
    const downloadCsvButton = document.getElementById('downloadCsvButton');
    const judgeNextParticipantButton = document.getElementById('judgeNextParticipantButton');
    const toastNotification = document.getElementById('toastNotification');

    // --- INICIALIZACIÓN ---
    function initialize() {
        participantAButton.addEventListener('click', () => switchParticipant('A'));
        participantBButton.addEventListener('click', () => switchParticipant('B'));
        
        difficultySelect.addEventListener('change', (e) => {
            difficulty = e.target.value;
            participantData[currentParticipant].difficulty = difficulty;
            updateAllScoresAndUI(); // Recalcular scores si cambia la dificultad
            showToast("Dificultad actualizada", "info");
        });

        tabTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const tabName = trigger.getAttribute('data-tab');
                setCurrentTab(tabName);
            });
        });
        
        Object.keys(descriptions).forEach(key => {
            const contentElement = document.getElementById(`tabContent${capitalize(key)}`);
            if (contentElement) {
                const descElement = contentElement.querySelector('.area-description');
                if (descElement) descElement.textContent = descriptions[key];
            }
        });

        populateSelect(staticModifierSelect, staticModifiers, m => `${m.name} (x${m.value})`, m => m.value);
        staticModifierSelect.value = selectedStaticModifier;
        staticModifierSelect.addEventListener('change', e => selectedStaticModifier = Number(e.target.value));
        
        populateSelect(staticExtraPointsSelect, extraPointOptions, o => o.name, o => o.value);
        staticExtraPointsSelect.value = selectedStaticExtra;
        staticExtraPointsSelect.addEventListener('change', e => selectedStaticExtra = Number(e.target.value));

        populateSelect(staticSuperExtraPointsSelect, extraPointOptions, o => o.name, o => o.value);
        staticSuperExtraPointsSelect.value = selectedStaticExtra;
        staticSuperExtraPointsSelect.addEventListener('change', e => selectedStaticExtra = Number(e.target.value));

        ['freestyle', 'statics', 'balance'].forEach(area => populateRecommendedTricks(area));
        buildPowerMoveSelectors();
        
        document.getElementById('pm_more_than_5_reps').addEventListener('change', e => {
            participantData[currentParticipant].pm_moreThan5Reps = e.target.checked;
            updateAllScoresAndUI();
        });

        ['Freestyle', 'Statics', 'Powermoves', 'Balance'].forEach(area => {
            document.getElementById(`combo${area}`).addEventListener('change', e => {
                participantData[currentParticipant].comboAreas[area.toLowerCase()] = e.target.checked;
                updateComboScoreAndTotal();
            });
        });
        document.getElementById('comboUnbroken').addEventListener('change', e => {
            participantData[currentParticipant].comboUnbroken = e.target.checked;
            updateComboScoreAndTotal();
        });
        document.getElementById('applyComboPenalty').addEventListener('click', () => {
            participantData[currentParticipant].directScores.combos = Math.max(0, (participantData[currentParticipant].directScores.combos || 0) - 1);
            updateAreaSubtotal('combos');
            updateTotalScore();
            showToast("Penalización de combo aplicada", "info");
        });
        
        addRecommendedTrickButton.addEventListener('click', handleAddRecommendedTrickToList);
        
        ['Freestyle', 'Statics', 'Powermoves', 'Balance'].forEach(area => {
            document.getElementById(`addCustom${capitalize(area)}TrickButton`).addEventListener('click', () => handleAddCustomTrick(area.toLowerCase()));
        });

        clearAllTricksButton.addEventListener('click', () => {
            if (confirm(`¿Segur que vols eliminar tots els trucs del participant ${currentParticipant}? Aquesta acció no es pot desfer.`)) {
                participantData[currentParticipant].tricks = [];
                updateAllScoresAndUI();
                showToast("Tots els trucs eliminats", "info");
            }
        });

        saveParticipantScoreButton.addEventListener('click', handleSaveParticipantScore);
        downloadCsvButton.addEventListener('click', handleDownloadCsv);
        judgeNextParticipantButton.addEventListener('click', () => {
            scoreSummarySection.style.display = 'none';
            scoreSummarySection.classList.remove('visible'); // Para animación
        });
        
        loadParticipantState(currentParticipant);
        updateCurrentParticipantIdDisplay();
    }

    // --- MANEJO DE PARTICIPANTE Y ESTADO ---
    function switchParticipant(participantId) {
        if (currentParticipant === participantId && !scoreSummarySection.style.display === 'none') return;
        
        if (scoreSummarySection.style.display !== 'none' && savedScores[currentParticipant]) {
            // Ok to switch if already saved and summary is shown
        } else if (participantData[currentParticipant].tricks.length > 0 || participantData[currentParticipant].directScores.combos > 0) {
            // Check for any meaningful score data
            if (!confirm(`Tens dades per al Participant ${currentParticipant}. Si canvies sense guardar, es perdran les puntuacions no finalitzades d'aquest participant. Vols continuar?`)) {
                return;
            }
        }

        // Ocultar y resetear el estado del panel de añadir truco recomendado antes de cambiar de pestaña o participante
        hideAndResetRecommendedControls();

        currentParticipant = participantId;
        scoreSummarySection.style.display = 'none'; // Ocultar resumen al cambiar
        scoreSummarySection.classList.remove('visible');

        loadParticipantState(currentParticipant);
        updateParticipantButtonsUI();
        updateCurrentParticipantIdDisplay();
        showToast(`Canviat al Participant ${currentParticipant}`, "info");
    }
    
    function loadParticipantState(participantId) {
        difficulty = participantData[participantId].difficulty;
        difficultySelect.value = difficulty;

        document.getElementById('pm_more_than_5_reps').checked = participantData[participantId].pm_moreThan5Reps;
        Object.keys(participantData[participantId].comboAreas).forEach(areaKey => {
            document.getElementById(`combo${capitalize(areaKey)}`).checked = participantData[participantId].comboAreas[areaKey];
        });
        document.getElementById('comboUnbroken').checked = participantData[participantId].comboUnbroken;

        ['Freestyle', 'Statics', 'Powermoves', 'Balance'].forEach(area => {
            document.getElementById(`custom${capitalize(area)}TrickName`).value = '';
            document.getElementById(`custom${capitalize(area)}TrickCost`).value = '';
            document.getElementById(`custom${capitalize(area)}TrickCleanliness`).value = 10;
        });

        // No llamar a resetNewRecommendedTrickState() aquí directamente, 
        // se llama en setCurrentTab y al seleccionar un truco.
        // Pero sí asegurar que el panel de añadir recomendado está oculto inicialmente.
        hideAndResetRecommendedControls();
        
        setCurrentTab(currentTab); // Refresca la UI de la pestaña actual
        updateAllScoresAndUI(); 
    }

    function updateParticipantButtonsUI() {
        participantAButton.classList.toggle('active', currentParticipant === 'A');
        participantBButton.classList.toggle('active', currentParticipant === 'B');
    }
    function updateCurrentParticipantIdDisplay() {
        currentParticipantIdDisplay.textContent = currentParticipant;
    }

    function setCurrentTab(tabName) {
        // Antes de cambiar de pestaña, ocultar los controles de añadir truco recomendado
        hideAndResetRecommendedControls();

        currentTab = tabName;
        tabTriggers.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabName));
        tabContents.forEach(c => {
            const isActive = c.id === `tabContent${capitalize(tabName)}`;
            if (isActive && c.style.display !== 'block') {
                c.style.display = 'block';
                // Trigger reflow for animation
                void c.offsetWidth; 
                c.classList.add('active-tab-content-animation');
            } else if (!isActive) {
                c.style.display = 'none';
                c.classList.remove('active-tab-content-animation');
            }
        });
        
        // No llamar a resetNewRecommendedTrickState() aquí directamente,
        // sino asegurar que los controles están listos/ocultos por hideAndResetRecommendedControls.
        // updateUIForCurrentTab se encargará de mostrar los controles si algo se selecciona en la nueva pestaña.
        updateUIForCurrentTab();
    }
    
    function hideAndResetRecommendedControls() {
        if (recommendedTrickAddControlsSection.parentNode) {
            // Lo devolvemos a su sitio original (fuera del DOM visible) o a un contenedor oculto si es necesario
            // Por ahora, simplemente lo ocultamos y reseteamos estado.
            document.body.appendChild(recommendedTrickAddControlsSection); // Moverlo fuera de placeholders
        }
        recommendedTrickAddControlsSection.style.display = 'none';
        selectedRecommendedTrickName = null;
        newTrickConfig = { name: "", base: 0, clean: 10, modifierValue: 1, extraPointsValue: 0, powerMoveDetails: {} };
        cleanlinessRecommendedInput.value = 10;
        selectedRecommendedTrickDisplayElement.textContent = "Selecciona un truc de la llista.";

        // Desmarcar botones de trucos recomendados en todas las pestañas
        document.querySelectorAll('.recommended-tricks-grid .button.selected').forEach(btn => btn.classList.remove('selected'));
    }


    function updateUIForCurrentTab() {
        // La visibilidad de recommendedTrickAddControlsSection se maneja al seleccionar un truco.
        // Aquí principalmente manejamos los modificadores específicos de pestañas.
        const isStaticTrickSelected = currentTab === 'statics' && selectedRecommendedTrickName;
        if (isStaticTrickSelected) {
            const isSuper = defaultTricksByTab.statics.find(t => t.name === selectedRecommendedTrickName)?.isSuper;
            staticsModifiersSection.style.display = !isSuper ? 'block' : 'none';
            staticsSuperMessage.style.display = isSuper ? 'block' : 'none';
        } else {
            staticsModifiersSection.style.display = 'none';
            staticsSuperMessage.style.display = 'none';
        }

        const isPowerMoveConfigured = currentTab === 'powermoves' && pm_staticElement;
         if(isPowerMoveConfigured) {
            // Mostrar y actualizar el panel de añadir recomendado para el PM configurado
            const placeholder = document.getElementById(`${currentTab}RecommendedControlsPlaceholder`);
            if (placeholder) {
                placeholder.appendChild(recommendedTrickAddControlsSection);
                recommendedTrickAddControlsSection.style.display = 'block';
                addRecommendedTrickTitleElement.textContent = `Afegir PowerMove Configurat`;
                selectedRecommendedTrickDisplayElement.textContent = `PM: ${capitalize(pm_category)} ${pm_exercise} ${pm_staticElement.originalStatic}`;
            }
        }
        // Si no hay un PM configurado Y no hay un truco recomendado seleccionado, el panel global debe estar oculto.
        // Esto se maneja en hideAndResetRecommendedControls y al seleccionar un truco recomendado.
    }

    function populateSelect(selectElement, options, textFn, valueFn) {
        if (!selectElement) return;
        selectElement.innerHTML = '';
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = valueFn(option);
            opt.textContent = textFn(option);
            selectElement.appendChild(opt);
        });
    }

    function populateRecommendedTricks(tabKey) {
        const container = document.getElementById(`${tabKey}RecommendedTricks`);
        if (!container || !defaultTricksByTab[tabKey]) return;

        const sortedTricks = [...defaultTricksByTab[tabKey]].sort((a, b) => b.base - a.base);
        
        container.innerHTML = '';
        sortedTricks.forEach(trick => {
            const button = document.createElement('button');
            button.classList.add('button');
            button.textContent = `${trick.name} (Base: ${trick.base}) ${trick.isSuper ? "[S]" : ""}`;
            button.addEventListener('click', () => {
                // Primero, deseleccionar cualquier otro truco en cualquier otra pestaña y ocultar controles
                hideAndResetRecommendedControls();

                selectedRecommendedTrickName = trick.name; 
                pm_staticElement = null; 
                
                newTrickConfig.name = trick.name;
                newTrickConfig.base = trick.base;
                
                // Desmarcar botón previo en esta misma grid
                container.querySelectorAll('.button.selected').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected'); // Marcar el nuevo

                // Mover y mostrar la sección de controles al placeholder de la pestaña actual
                const placeholder = document.getElementById(`${tabKey}RecommendedControlsPlaceholder`);
                if (placeholder) {
                    placeholder.appendChild(recommendedTrickAddControlsSection);
                    recommendedTrickAddControlsSection.style.display = 'block';
                    addRecommendedTrickTitleElement.textContent = `Afegir Truc Recomanat (${capitalize(tabKey)})`;
                    selectedRecommendedTrickDisplayElement.textContent = `Seleccionat: ${trick.name} (Base: ${trick.base})`;
                }


                if (tabKey === 'statics') {
                    const isSuper = trick.isSuper === true;
                    if (isSuper && staticsSuperMessage.querySelector('p')) {
                         staticsSuperMessage.querySelector('p').textContent = `Supertruc: ${trick.base}p base. No s'apliquen mod. de posició.`;
                    }
                    selectedStaticModifier = staticModifiers.find(m => m.name === "Full").value;
                    staticModifierSelect.value = selectedStaticModifier;
                    selectedStaticExtra = 0;
                    staticExtraPointsSelect.value = selectedStaticExtra;
                    staticSuperExtraPointsSelect.value = selectedStaticExtra;
                }
                updateUIForCurrentTab(); // Actualiza visibilidad de modificadores de estáticos, etc.
            });
            container.appendChild(button);
        });
    }

    // --- LÓGICA DE CÁLCULO Y ADICIÓN DE TRUCOS ---
    function getDifficultyMultiplierVal() {
        const multipliers = { beginner: 1.5, amateur: 1, professional: 0.75 };
        return multipliers[difficulty] || 1;
    }
    
    function addTrickToParticipant(trickData) {
        participantData[currentParticipant].tricks.push(trickData);
        updateAllScoresAndUI();
        showToast(`"${trickData.displayName}" afegit!`, "success");
    }

    function handleAddRecommendedTrickToList() {
        if (currentTab === 'combos') return;
        if (!selectedRecommendedTrickName && !(currentTab === 'powermoves' && pm_staticElement)) {
             showToast("Selecciona un truc recomanat o configura un PowerMove complet.", "error");
             return;
        }

        const cleanVal = parseInt(cleanlinessRecommendedInput.value) || 10; // Usar el input renombrado
        const difficultyMult = getDifficultyMultiplierVal();
        let trickDetails = {
            area: currentTab,
            cleanScore: cleanVal,
            difficultyMultiplierApplied: difficultyMult,
            repetitionFactor: 1,
            staticModifierName: 'N/A', staticModifierValue: 1,
            extraPointsValue: 0,
        };

        if (currentTab === "statics") {
            const baseTrickDef = defaultTricksByTab.statics.find(t => t.name === selectedRecommendedTrickName);
            trickDetails.nameForRepetition = selectedRecommendedTrickName;
            trickDetails.basePoints = baseTrickDef.base;
            trickDetails.isSuperStatic = baseTrickDef.isSuper === true;
            
            if (!trickDetails.isSuperStatic) {
                trickDetails.staticModifierValue = selectedStaticModifier;
                trickDetails.staticModifierName = staticModifiers.find(m => m.value === selectedStaticModifier)?.name || 'Full';
            }
            trickDetails.extraPointsValue = selectedStaticExtra;
            trickDetails.displayName = selectedRecommendedTrickName + 
                (trickDetails.isSuperStatic ? " (Super)" : ` (${trickDetails.staticModifierName})`) +
                (selectedStaticExtra > 0 ? ` +${selectedStaticExtra}p` : "");

        } else if (currentTab === "powermoves") {
            if (!pm_category || !pm_exercise || !pm_staticElement) { showToast("Configura el PowerMove.", "error"); return; }
            const staticInfoForPM = baseStatics[pm_staticElement.originalStatic];
            trickDetails.isPowerMove = true;
            trickDetails.nameForRepetition = `PM-${pm_category}-${pm_exercise}-${pm_staticElement.originalStatic}`;
            trickDetails.basePoints = staticInfoForPM / 3;
            
            trickDetails.staticModifierValue = selectedPowerMoveModifier;
            trickDetails.staticModifierName = staticModifiers.find(m => m.value === selectedPowerMoveModifier)?.name || 'Full';
            trickDetails.extraPointsValue = selectedPowerMoveExtra;
            trickDetails.powerMoveDetails = { category: pm_category, exercise: pm_exercise, staticElementOriginalName: pm_staticElement.originalStatic };

            trickDetails.displayName = `${capitalize(pm_category)} ${pm_exercise} ${pm_staticElement.originalStatic} (${trickDetails.staticModifierName})` +
                (selectedPowerMoveExtra > 0 ? ` +${selectedPowerMoveExtra}p` : "");
        
        } else if (currentTab === "freestyle" || currentTab === "balance") {
            const baseTrickDef = defaultTricksByTab[currentTab].find(t => t.name === selectedRecommendedTrickName);
            trickDetails.nameForRepetition = selectedRecommendedTrickName;
            trickDetails.basePoints = baseTrickDef.base;
            trickDetails.displayName = selectedRecommendedTrickName;
        }
        
        addTrickToParticipant(trickDetails);
        
        // Después de añadir, ocultar y resetear los controles de añadir truco recomendado
        hideAndResetRecommendedControls();
        if (currentTab === "powermoves") { pm_staticElement = null; buildPowerMoveSelectors(); }
    }

    function handleAddCustomTrick(area) {
        const nameInput = document.getElementById(`custom${capitalize(area)}TrickName`);
        const costInput = document.getElementById(`custom${capitalize(area)}TrickCost`);
        const cleanlinessInput = document.getElementById(`custom${capitalize(area)}TrickCleanliness`);

        const trickName = nameInput.value.trim();
        const trickCost = parseFloat(costInput.value);
        const cleanVal = parseInt(cleanlinessInput.value) || 10;

        if (!trickName || isNaN(trickCost) || trickCost <= 0) {
            showToast("Nom i cost base (positiu) són requerits per a trucs personalitzats.", "error");
            return;
        }
        const difficultyMult = getDifficultyMultiplierVal();
        let trickDetails = {
            area: area,
            nameForRepetition: `Custom-${area}-${trickName}`,
            displayName: `${trickName} (Custom)`,
            basePoints: trickCost,
            cleanScore: cleanVal,
            difficultyMultiplierApplied: difficultyMult,
            repetitionFactor: 1,
            staticModifierName: 'N/A', staticModifierValue: 1,
            extraPointsValue: 0,
            isCustom: true,
        };

        if (area === "powermoves") trickDetails.isPowerMove = true;
        
        addTrickToParticipant(trickDetails);
        nameInput.value = ''; costInput.value = ''; cleanlinessInput.value = 10;
    }

    function removeTrick(index) {
        participantData[currentParticipant].tricks.splice(index, 1);
        updateAllScoresAndUI();
        showToast("Truc eliminat.", "info");
    }
    
    function updateAllScoresAndUI() {
        const currentTricks = participantData[currentParticipant].tricks;
        const recalculatedTricks = [];
        const runningTrickCounts = {}; 

        for (const trick of currentTricks) {
            const trickRepetitionId = trick.nameForRepetition;
            runningTrickCounts[trickRepetitionId] = (runningTrickCounts[trickRepetitionId] || 0) + 1;
            const countForThisInstance = runningTrickCounts[trickRepetitionId];

            let currentRepetitionFactor = 1;
            // Aplicar penalización a Freestyle, Statics, Powermoves, Balance
            if (trick.area === "powermoves" || trick.area === "freestyle" || trick.area === "balance" || trick.area === "statics") {
                if (countForThisInstance === 2) currentRepetitionFactor = 0.66;
                else if (countForThisInstance === 3) currentRepetitionFactor = 0.33;
                else if (countForThisInstance > 3) currentRepetitionFactor = 0;
            }

            let score = trick.basePoints;
            if (trick.isPowerMove || (trick.area === "statics" && !trick.isSuperStatic && !trick.isCustom)) { // Custom statics no usan modif. de lista
                score *= trick.staticModifierValue;
            }
            
            score *= trick.difficultyMultiplierApplied;
            score *= (trick.cleanScore / 10);
            score += trick.extraPointsValue;
            score *= currentRepetitionFactor;
            
            recalculatedTricks.push({ ...trick, finalScore: Math.max(0, score), repetitionFactor: currentRepetitionFactor });
        }
        participantData[currentParticipant].tricks = recalculatedTricks;
        
        Object.keys(descriptions).forEach(key => updateAreaSubtotal(key));
        updateAreaSubtotal('combos');
        renderTricksList();
        updateTotalScore();
    }

    function getAreaScore(area) {
        if (area === "combos") {
            return participantData[currentParticipant].directScores.combos || 0;
        }
        return participantData[currentParticipant].tricks
            .filter(t => t.area === area)
            .reduce((sum, trick) => sum + (trick.finalScore || 0), 0);
    }

    function updateAreaSubtotal(areaKey) {
         const subtotalElement = document.getElementById(`${areaKey}Subtotal`);
         if (subtotalElement) {
            let score = getAreaScore(areaKey);
            
            if (areaKey === "powermoves" && participantData[currentParticipant].pm_moreThan5Reps) {
                score += 1;
            }

            if (maxScoresPerArea[areaKey] !== undefined && score > maxScoresPerArea[areaKey]) {
                score = maxScoresPerArea[areaKey];
            }
            if (areaKey === "combos") {
                participantData[currentParticipant].directScores.combos = score;
            }
            subtotalElement.textContent = score.toFixed(2);
         }
    }
    
    function updateComboScoreAndTotal() {
        let comboScoreFromCheckboxes = 0;
        const { comboAreas, comboUnbroken } = participantData[currentParticipant];
        if (comboAreas.freestyle) comboScoreFromCheckboxes += 2;
        if (comboAreas.statics) comboScoreFromCheckboxes += 2;
        if (comboAreas.powermoves) comboScoreFromCheckboxes += 2;
        if (comboAreas.balance) comboScoreFromCheckboxes += 2;
        if (comboUnbroken) comboScoreFromCheckboxes += 2;
        
        participantData[currentParticipant].directScores.combos = Math.min(comboScoreFromCheckboxes, maxScoresPerArea.combos);
        
        updateAreaSubtotal('combos');
        updateTotalScore();
    }

    function updateTotalScore() {
        let total = 0;
        ['freestyle', 'statics', 'powermoves', 'balance', 'combos'].forEach(areaKey => {
            const subtotalElement = document.getElementById(`${areaKey}Subtotal`);
            if(subtotalElement) total += parseFloat(subtotalElement.textContent) || 0;
        });
        totalScoreDisplay.textContent = total.toFixed(2);
    }

    function renderTricksList() {
        tricksListElement.innerHTML = ''; 
        const currentTricks = participantData[currentParticipant].tricks;
        tricksCountElement.textContent = currentTricks.length;

        if (currentTricks.length === 0) {
            if (noTricksMessage) {
                noTricksMessage.style.display = 'block';
                tricksListElement.appendChild(noTricksMessage);
            }
            return;
        }
        if (noTricksMessage) noTricksMessage.style.display = 'none';

        currentTricks.forEach((trick, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="trick-info">
                    <span class="trick-name">${trick.displayName} <span class="trick-area-badge">${trick.area}</span></span>
                    <span class="trick-details">Base: ${trick.basePoints.toFixed(2)}, Neteja: ${trick.cleanScore}/10, Rep. x${trick.repetitionFactor.toFixed(2)}, Score: ${trick.finalScore.toFixed(2)}</span>
                </div>
                <button class="button button-destructive small-btn" data-index="${index}" title="Eliminar truc">✕</button>
            `;
            li.querySelector('.button-destructive').addEventListener('click', () => removeTrick(index));
            tricksListElement.appendChild(li);
        });
    }
    
    function buildPowerMoveSelectors() {
        const container = document.getElementById('powermoveSelectorContainer');
        if (!container) return;
        container.innerHTML = ''; 

        const title = document.createElement('h3');
        title.textContent = 'Configurar PowerMove (Recomanat):';
        container.appendChild(title);

        const categorySelect = createSelectForPM(Object.keys(defaultTricksByTab.powermoves), "1. Tipus", pm_category, (val) => {
            pm_category = val; pm_exercise = null; pm_staticElement = null; selectedRecommendedTrickName = null;
            hideAndResetRecommendedControls(); // Ocultar panel de añadir si se cambia config de PM
            buildPowerMoveSelectors(); updateUIForCurrentTab();
        });
        container.appendChild(categorySelect);

        if (pm_category && defaultTricksByTab.powermoves[pm_category]) {
            const exercises = Object.keys(defaultTricksByTab.powermoves[pm_category]);
            const exerciseSelect = createSelectForPM(exercises, "2. Exercici", pm_exercise, (val) => {
                pm_exercise = val; pm_staticElement = null; selectedRecommendedTrickName = null;
                hideAndResetRecommendedControls();
                buildPowerMoveSelectors(); updateUIForCurrentTab();
            });
            container.appendChild(exerciseSelect);
        }

        if (pm_category && pm_exercise && defaultTricksByTab.powermoves[pm_category][pm_exercise]) {
            const staticElementsForPM = defaultTricksByTab.powermoves[pm_category][pm_exercise];
            const staticElementSelect = document.createElement('select');
            staticElementSelect.classList.add('select', 'modern-select');
            
            const placeholderOpt = document.createElement('option');
            placeholderOpt.value = ""; placeholderOpt.textContent = "3. Element Base";
            placeholderOpt.disabled = !pm_staticElement; placeholderOpt.selected = !pm_staticElement;
            staticElementSelect.appendChild(placeholderOpt);

            staticElementsForPM.forEach(el => {
                const opt = document.createElement('option');
                opt.value = el.originalStatic; 
                opt.textContent = `${el.originalStatic} (Base: ${(el.staticBase/3).toFixed(2)}/rep)`;
                if (pm_staticElement && pm_staticElement.originalStatic === el.originalStatic) opt.selected = true;
                staticElementSelect.appendChild(opt);
            });
            
            staticElementSelect.addEventListener('change', (e) => {
                const selectedName = e.target.value;
                selectedRecommendedTrickName = null; // PM no es un truco recomendado simple
                if (selectedName) {
                    pm_staticElement = staticElementsForPM.find(s => s.originalStatic === selectedName) || null;
                    if (pm_staticElement) {
                        selectedPowerMoveModifier = staticModifiers.find(m => m.name === "Full").value;
                        selectedPowerMoveExtra = 0;
                        // Mostrar panel de añadir recomendado para el PM configurado
                        const placeholder = document.getElementById(`powermovesRecommendedControlsPlaceholder`);
                        if (placeholder) {
                            placeholder.appendChild(recommendedTrickAddControlsSection);
                            recommendedTrickAddControlsSection.style.display = 'block';
                            addRecommendedTrickTitleElement.textContent = `Afegir PowerMove Configurat`;
                            selectedRecommendedTrickDisplayElement.textContent = `PM: ${capitalize(pm_category)} ${pm_exercise} ${pm_staticElement.originalStatic}`;
                        }
                    } else {
                         hideAndResetRecommendedControls(); // Si se deselecciona el elemento base
                    }
                } else { pm_staticElement = null; hideAndResetRecommendedControls(); }
                buildPowerMoveSelectors(); // Reconstruir para mostrar/ocultar mod/extra
                updateUIForCurrentTab();
            });
            container.appendChild(staticElementSelect);
        }
        
        if (pm_staticElement) {
            const pmModifierLabel = document.createElement('label'); pmModifierLabel.className = 'label-modern';
            pmModifierLabel.textContent = "Modificador PM:"; container.appendChild(pmModifierLabel);
            const pmModifierSelect = createSelectWithOptionsForPM(staticModifiers, selectedPowerMoveModifier, m => `${m.name} (x${m.value})`, m => m.value, (val) => selectedPowerMoveModifier = Number(val));
            container.appendChild(pmModifierSelect);

            const pmExtraLabel = document.createElement('label'); pmExtraLabel.className = 'label-modern';
            pmExtraLabel.textContent = "Extra PM:"; container.appendChild(pmExtraLabel);
            const pmExtraSelect = createSelectWithOptionsForPM(extraPointOptions, selectedPowerMoveExtra, o => o.name, o => o.value, (val) => selectedPowerMoveExtra = Number(val));
            container.appendChild(pmExtraSelect);
        }
        updateUIForCurrentTab();
    }
    
    function createSelectForPM(optionsArray, placeholderText, currentValue, onChangeCallback) {
        const select = document.createElement('select');
        select.classList.add('select', 'modern-select');
        const placeholder = document.createElement('option');
        placeholder.value = ""; placeholder.textContent = placeholderText;
        if (!currentValue) { placeholder.selected = true; placeholder.disabled = true; }
        else { placeholder.disabled = false; }
        select.appendChild(placeholder);
        optionsArray.forEach(optVal => {
            const option = document.createElement('option');
            option.value = optVal; option.textContent = capitalize(optVal);
            if (currentValue === optVal) option.selected = true;
            select.appendChild(option);
        });
        select.addEventListener('change', (e) => onChangeCallback(e.target.value));
        return select;
    }
    function createSelectWithOptionsForPM(optionsData, currentValue, textFn, valueFn, onChangeCallback) {
        const select = document.createElement('select');
        select.classList.add('select', 'modern-select');
        optionsData.forEach(item => {
            const option = document.createElement('option');
            option.value = valueFn(item); option.textContent = textFn(item);
            if (String(currentValue) === String(valueFn(item))) option.selected = true;
            select.appendChild(option);
        });
        select.addEventListener('change', (e) => onChangeCallback(e.target.value));
        return select;
    }

    function handleSaveParticipantScore() {
        if (participantData[currentParticipant].tricks.length === 0 && participantData[currentParticipant].directScores.combos === 0) {
            showToast(`No hi ha puntuacions per guardar per al Participant ${currentParticipant}.`, "error");
            return;
        }
        const summaryData = {
            participantId: currentParticipant,
            difficulty: difficulty,
            difficultyMultiplier: getDifficultyMultiplierVal(),
            tricks: JSON.parse(JSON.stringify(participantData[currentParticipant].tricks)),
            subtotals: {},
            pmBonus: participantData[currentParticipant].pm_moreThan5Reps ? 1 : 0,
            grandTotal: 0,
        };
        ['freestyle', 'statics', 'powermoves', 'balance', 'combos'].forEach(area => {
            summaryData.subtotals[area] = parseFloat(document.getElementById(`${area}Subtotal`).textContent) || 0;
        });
        summaryData.grandTotal = parseFloat(totalScoreDisplay.textContent) || 0;
        
        savedScores[currentParticipant] = summaryData;
        
        displayScoreSummary(currentParticipant);
        scoreSummarySection.style.display = 'block';
        scoreSummarySection.classList.add('visible'); // Para animación
        scoreSummarySection.scrollIntoView({ behavior: 'smooth' });
        showToast(`Puntuació del Participant ${currentParticipant} finalitzada.`, "success");
    }

    function displayScoreSummary(participantId) {
        const summary = savedScores[participantId];
        if (!summary) return;
        summaryParticipantNameElement.textContent = `Resum Participant ${participantId}`;
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Truc</th><th>Àrea</th><th>Base</th><th>Neteja</th>
                        <th>Mod.</th><th>Extra</th><th>xDiff</th><th>xRep</th><th>Score Final</th>
                    </tr>
                </thead>
                <tbody>`;
        summary.tricks.forEach(trick => {
            tableHTML += `
                <tr>
                    <td>${trick.displayName}</td>
                    <td>${capitalize(trick.area)}</td>
                    <td>${trick.basePoints.toFixed(2)}</td>
                    <td>${trick.cleanScore}/10</td>
                    <td>${trick.staticModifierName !== 'N/A' ? `${trick.staticModifierName} (x${trick.staticModifierValue.toFixed(2)})` : '-'}</td>
                    <td>${trick.extraPointsValue.toFixed(2)}</td>
                    <td>x${trick.difficultyMultiplierApplied.toFixed(2)}</td>
                    <td>x${trick.repetitionFactor.toFixed(2)}</td>
                    <td><strong>${trick.finalScore.toFixed(2)}</strong></td>
                </tr>`;
        });
        tableHTML += `</tbody><tfoot>`;
        Object.keys(summary.subtotals).forEach(area => {
            let areaDisplayName = capitalize(area);
            let subtotalValue = summary.subtotals[area];
            if (area === "powermoves" && summary.pmBonus > 0) {
                areaDisplayName += " (+1 Bonus Reps)";
            }
             tableHTML += `<tr><td colspan="8" style="text-align:right;">Subtotal ${areaDisplayName}:</td><td><strong>${subtotalValue.toFixed(2)}</strong></td></tr>`;
        });
        tableHTML += `<tr class="grand-total"><td colspan="8" style="text-align:right;">TOTAL PARTICIPANT (${participantId}):</td><td><strong>${summary.grandTotal.toFixed(2)}</strong></td></tr>`;
        tableHTML += `</tfoot></table>`;
        scoreTableContainer.innerHTML = tableHTML;
    }

    function handleDownloadCsv() {
        const summary = savedScores[currentParticipant];
        if (!summary) {
            showToast("No hi ha resum per descarregar.", "error"); return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Truc,Àrea,Punts Base,Neteja,Modificador Nom,Modificador Valor,Punts Extra,Multiplicador Dificultat,Factor Repetició,Score Final Truc\r\n";
        summary.tricks.forEach(trick => {
            const row = [
                `"${trick.displayName.replace(/"/g, '""')}"`, capitalize(trick.area),
                trick.basePoints.toFixed(2), `${trick.cleanScore}/10`,
                trick.staticModifierName, trick.staticModifierValue.toFixed(2),
                trick.extraPointsValue.toFixed(2), trick.difficultyMultiplierApplied.toFixed(2),
                trick.repetitionFactor.toFixed(2), trick.finalScore.toFixed(2)
            ].join(",");
            csvContent += row + "\r\n";
        });
        csvContent += "\r\n";
        Object.keys(summary.subtotals).forEach(area => {
            let areaDisplayName = capitalize(area);
            if (area === "powermoves" && summary.pmBonus > 0) areaDisplayName += " (+1 Bonus Reps)";
            csvContent += `Subtotal ${areaDisplayName},,,,,,,,,${summary.subtotals[area].toFixed(2)}\r\n`;
        });
        csvContent += `TOTAL PARTICIPANT ${summary.participantId} (Dificultat: ${summary.difficulty}),,,,,,,,,${summary.grandTotal.toFixed(2)}\r\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `puntuacion_participant_${summary.participantId}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        showToast("CSV descarregat!", "success");
    }

    function capitalize(s) {
        if (typeof s !== 'string' || !s) return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function showToast(message, type = 'info') {
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification ' + type; // Quita 'show' primero por si acaso
        void toastNotification.offsetWidth; // Trigger reflow
        toastNotification.classList.add('show');
        
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3000);
    }

    initialize();
});
