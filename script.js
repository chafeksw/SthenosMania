document.addEventListener('DOMContentLoaded', () => {
    // Definiciones de datos (igual que antes)
    const staticModifiers = [ /* ... */ ];
    const extraPointOptions = [ /* ... */ ];
    const baseStatics = { /* ... */ };
    const defaultTricksByTab = { /* ... */ }; // Sin cambios aquí
    const descriptions = { /* ... */ }; // Podrías actualizar descripciones de PM y Combo
    const maxScoresPerArea = { /* ... */ };

    // Estado de la aplicación
    let currentParticipant = "A";
    let difficulty = "amateur";
    let participantData = {
        A: { tricks: [], directScores: { combos: 0, comboCriteria: {} }, pm_moreThan5Reps: false, difficulty: "amateur" },
        B: { tricks: [], directScores: { combos: 0, comboCriteria: {} }, pm_moreThan5Reps: false, difficulty: "amateur" }
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

    // --- Elementos del DOM (se mantienen la mayoría, se añaden los de combos) ---
    // ... (los mismos que antes) ...
    const powermoveRepsRecommendedSection = document.getElementById('powermoveRepsRecommendedSection');
    const powermoveRepsRecommendedInput = document.getElementById('powermoveRepsRecommended');

    // Combo elements
    const comboCritFreestyle = document.getElementById('comboCritFreestyle');
    const comboCritStatics = document.getElementById('comboCritStatics');
    const comboCritPowermoves = document.getElementById('comboCritPowermoves');
    const comboCritBalance = document.getElementById('comboCritBalance');
    const comboCritUnbroken = document.getElementById('comboCritUnbroken');
    const comboCritDeadStop = document.getElementById('comboCritDeadStop');
    const comboCritCleanExecution = document.getElementById('comboCritCleanExecution');
    const comboCritCombinations = document.getElementById('comboCritCombinations');
    const comboCritFluidity = document.getElementById('comboCritFluidity');
    const comboAddPerfectionPointButton = document.getElementById('comboAddPerfectionPoint');
    const comboApplyLowCleanlinessPenaltyButton = document.getElementById('comboApplyLowCleanlinessPenalty');


    // --- INICIALIZACIÓN ---
    function initialize() {
        // ... (inicialización de botones de participante, dificultad, tabs, etc. se mantiene) ...
        participantAButton.addEventListener('click', () => switchParticipant('A'));
        participantBButton.addEventListener('click', () => switchParticipant('B'));
        
        difficultySelect.addEventListener('change', (e) => {
            difficulty = e.target.value;
            participantData[currentParticipant].difficulty = difficulty;
            updateAllScoresAndUI(); 
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
            updateAllScoresAndUI(); // El bonus de PM se aplica en updateAreaSubtotal
        });

        // Nueva inicialización de Combos
        const comboCheckboxes = [
            comboCritFreestyle, comboCritStatics, comboCritPowermoves, comboCritBalance,
            comboCritUnbroken, comboCritDeadStop, comboCritCleanExecution, comboCritCombinations, comboCritFluidity
        ];
        comboCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                participantData[currentParticipant].directScores.comboCriteria[checkbox.id] = checkbox.checked;
                updateComboScoreAndTotal();
            });
        });
        comboAddPerfectionPointButton.addEventListener('click', () => {
            // Permitir solo un punto extra por perfección
            if (!participantData[currentParticipant].directScores.comboCriteria.perfectionPoint) {
                participantData[currentParticipant].directScores.comboCriteria.perfectionPoint = true;
                updateComboScoreAndTotal();
                showToast("Punt extra per Perfecció afegit!", "success");
            } else {
                showToast("El punt extra per Perfecció ja ha sigut afegit.", "info");
            }
        });
        comboApplyLowCleanlinessPenaltyButton.addEventListener('click', () => {
            // Permitir solo una penalización por limpieza baja
            if (!participantData[currentParticipant].directScores.comboCriteria.lowCleanlinessPenalty) {
                 participantData[currentParticipant].directScores.comboCriteria.lowCleanlinessPenalty = true;
                 updateComboScoreAndTotal();
                 showToast("Penalització per Neteja Baixa aplicada.", "info");
            } else {
                showToast("La penalització per Neteja Baixa ja ha sigut aplicada.", "info");
            }
        });
        
        addRecommendedTrickButton.addEventListener('click', handleAddRecommendedTrickToList);
        
        ['Freestyle', 'Statics', 'Powermoves', 'Balance'].forEach(area => {
            document.getElementById(`addCustom${capitalize(area)}TrickButton`).addEventListener('click', () => handleAddCustomTrick(area.toLowerCase()));
        });

        clearAllTricksButton.addEventListener('click', () => {
            if (confirm(`¿Segur que vols eliminar tots els trucs del participant ${currentParticipant}? Aquesta acció no es pot desfer.`)) {
                participantData[currentParticipant].tricks = [];
                // Resetear también el estado de comboCriteria para el participante actual
                participantData[currentParticipant].directScores.comboCriteria = {};
                updateAllScoresAndUI();
                showToast("Tots els trucs i puntuacions de combo eliminats", "info");
            }
        });

        saveParticipantScoreButton.addEventListener('click', handleSaveParticipantScore);
        downloadCsvButton.addEventListener('click', handleDownloadCsv);
        judgeNextParticipantButton.addEventListener('click', () => {
            scoreSummarySection.style.display = 'none';
            scoreSummarySection.classList.remove('visible');
        });
        
        loadParticipantState(currentParticipant);
        updateCurrentParticipantIdDisplay();
    }

    // --- MANEJO DE PARTICIPANTE Y ESTADO ---
    function switchParticipant(participantId) {
        if (currentParticipant === participantId && !scoreSummarySection.style.display === 'none') return;
        
        const currentPData = participantData[currentParticipant];
        const hasUnsavedChanges = currentPData.tricks.length > 0 || 
                                  Object.keys(currentPData.directScores.comboCriteria).some(key => currentPData.directScores.comboCriteria[key]) ||
                                  currentPData.directScores.combos !== 0; // Considerar si combos > 0 también es un cambio

        if (scoreSummarySection.style.display !== 'none' && savedScores[currentParticipant]) {
            // Ok
        } else if (hasUnsavedChanges) {
            if (!confirm(`Tens dades per al Participant ${currentParticipant}. Si canvies sense guardar, es perdran les puntuacions no finalitzades d'aquest participant. Vols continuar?`)) {
                return;
            }
        }
        hideAndResetRecommendedControls();
        currentParticipant = participantId;
        scoreSummarySection.style.display = 'none'; 
        scoreSummarySection.classList.remove('visible');
        loadParticipantState(currentParticipant);
        updateParticipantButtonsUI();
        updateCurrentParticipantIdDisplay();
        showToast(`Canviat al Participant ${currentParticipant}`, "info");
    }
    
    function loadParticipantState(participantId) {
        const pData = participantData[participantId];
        difficulty = pData.difficulty;
        difficultySelect.value = difficulty;

        document.getElementById('pm_more_than_5_reps').checked = pData.pm_moreThan5Reps;
        
        // Cargar estado de checkboxes de combo
        const comboCheckboxesIds = [
            'comboCritFreestyle', 'comboCritStatics', 'comboCritPowermoves', 'comboCritBalance',
            'comboCritUnbroken', 'comboCritDeadStop', 'comboCritCleanExecution', 'comboCritCombinations', 'comboCritFluidity'
        ];
        comboCheckboxesIds.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = pData.directScores.comboCriteria[id] || false;
            }
        });
        // El estado de perfectionPoint y lowCleanlinessPenalty se gestiona en pData.directScores.comboCriteria

        ['Freestyle', 'Statics', 'Powermoves', 'Balance'].forEach(area => {
            document.getElementById(`custom${capitalize(area)}TrickName`).value = '';
            document.getElementById(`custom${capitalize(area)}TrickCost`).value = '';
            document.getElementById(`custom${capitalize(area)}TrickCleanliness`).value = 10;
            if (area === 'Powermoves') {
                document.getElementById(`customPowermovesTrickReps`).value = 1;
            }
        });
        
        hideAndResetRecommendedControls();
        setCurrentTab(currentTab); 
        updateAllScoresAndUI(); 
    }
    
    // ... (updateParticipantButtonsUI, updateCurrentParticipantIdDisplay, setCurrentTab, hideAndResetRecommendedControls se mantienen) ...

    function updateUIForCurrentTab() {
        // Mostrar input de repeticiones para PowerMoves recomendados si es la pestaña y hay un PM configurado
        const isPowerMoveTabAndConfigured = currentTab === 'powermoves' && pm_staticElement;
        powermoveRepsRecommendedSection.style.display = isPowerMoveTabAndConfigured ? 'block' : 'none';
        if(isPowerMoveTabAndConfigured) powermoveRepsRecommendedInput.value = 1; // Reset reps a 1

        // Visibilidad de modificadores de estáticos
        const isStaticTrickSelected = currentTab === 'statics' && selectedRecommendedTrickName;
        if (isStaticTrickSelected) {
            const isSuper = defaultTricksByTab.statics.find(t => t.name === selectedRecommendedTrickName)?.isSuper;
            staticsModifiersSection.style.display = !isSuper ? 'block' : 'none';
            staticsSuperMessage.style.display = isSuper ? 'block' : 'none';
        } else {
            staticsModifiersSection.style.display = 'none';
            staticsSuperMessage.style.display = 'none';
        }

        // Mover y mostrar el panel de añadir truco recomendado
        const placeholderId = `${currentTab}RecommendedControlsPlaceholder`;
        const placeholder = document.getElementById(placeholderId);
        
        if (placeholder && (selectedRecommendedTrickName || isPowerMoveTabAndConfigured)) {
            placeholder.appendChild(recommendedTrickAddControlsSection);
            recommendedTrickAddControlsSection.style.display = 'block';
            if (isPowerMoveTabAndConfigured) {
                addRecommendedTrickTitleElement.textContent = `Afegir PowerMove Configurat`;
                selectedRecommendedTrickDisplayElement.textContent = `PM: ${capitalize(pm_category)} ${pm_exercise} ${pm_staticElement.originalStatic}`;
            } else if (selectedRecommendedTrickName) {
                 addRecommendedTrickTitleElement.textContent = `Afegir Truc Recomanat (${capitalize(currentTab)})`;
                 selectedRecommendedTrickDisplayElement.textContent = `Seleccionat: ${newTrickConfig.name} (Base: ${newTrickConfig.base})`;
            }
        } else if (recommendedTrickAddControlsSection.parentNode !== document.body) { // Si no hay placeholder o nada seleccionado, asegurar que está oculto
            hideAndResetRecommendedControls();
        }
    }


    function populateSelect(selectElement, options, textFn, valueFn) { /* ... se mantiene ... */ }
    function populateRecommendedTricks(tabKey) { /* ... se mantiene ... */ }


    // --- LÓGICA DE CÁLCULO Y ADICIÓN DE TRUCOS ---
    function getDifficultyMultiplierVal() { /* ... se mantiene ... */ }
    
    function addTrickToParticipant(trickData) { /* ... se mantiene ... */ }

    // Nueva función para calcular el score de un set de PowerMoves
    function calculatePowerMoveSetScore(basePointsPerRep, numReps, cleanScore, staticModifierValue, extraPointsValue, difficultyMultiplier) {
        let totalScoreForSet = 0;
        for (let i = 1; i <= numReps; i++) {
            let repScore = basePointsPerRep * staticModifierValue; // Base con modificador de posición
            
            // Aplicar penalización por repetición específica de PowerMoves
            if (i === 4) repScore *= 0.66; // 4ª repe
            else if (i === 5) repScore *= 0.33; // 5ª repe
            else if (i > 5) repScore = 0; // A partir de la 6ª, 0 (o un valor mínimo si se prefiere)
            // Las primeras 3 (i=1,2,3) no tienen reducción aquí.

            totalScoreForSet += repScore;
        }
        // Aplicar limpieza, extras y dificultad al total del SET de repeticiones
        totalScoreForSet *= (cleanScore / 10);
        totalScoreForSet += extraPointsValue; // Los extras se suman una vez por el set de PM? O por rep? Asumo por set.
        totalScoreForSet *= difficultyMultiplier;
        return Math.max(0, totalScoreForSet);
    }

    function handleAddRecommendedTrickToList() {
        if (currentTab === 'combos') return;
        if (!selectedRecommendedTrickName && !(currentTab === 'powermoves' && pm_staticElement)) {
             showToast("Selecciona un truc recomanat o configura un PowerMove complet.", "error");
             return;
        }

        const cleanVal = parseInt(cleanlinessRecommendedInput.value) || 10;
        const difficultyMult = getDifficultyMultiplierVal();
        let trickDetails = {
            area: currentTab,
            cleanScore: cleanVal,
            difficultyMultiplierApplied: difficultyMult,
            repetitionFactor: 1, 
            staticModifierName: 'N/A', staticModifierValue: 1,
            extraPointsValue: 0,
            numReps: 1 // Por defecto para no-PMs
        };

        if (currentTab === "powermoves") {
            if (!pm_category || !pm_exercise || !pm_staticElement) { showToast("Configura el PowerMove.", "error"); return; }
            const numReps = parseInt(powermoveRepsRecommendedInput.value) || 1;
            const staticInfoForPM = baseStatics[pm_staticElement.originalStatic];
            
            trickDetails.isPowerMove = true;
            trickDetails.nameForRepetition = `PM-${pm_category}-${pm_exercise}-${pm_staticElement.originalStatic}`; // Para contar SETS de PM
            trickDetails.basePoints = staticInfoForPM / 3; // Base por repetición individual ANTES de la nueva lógica
            trickDetails.numReps = numReps;
            
            trickDetails.staticModifierValue = selectedPowerMoveModifier;
            trickDetails.staticModifierName = staticModifiers.find(m => m.value === selectedPowerMoveModifier)?.name || 'Full';
            trickDetails.extraPointsValue = selectedPowerMoveExtra;
            trickDetails.powerMoveDetails = { category: pm_category, exercise: pm_exercise, staticElementOriginalName: pm_staticElement.originalStatic };

            trickDetails.displayName = `${capitalize(pm_category)} ${pm_exercise} ${pm_staticElement.originalStatic} (${trickDetails.staticModifierName}) [${numReps} reps]`;
            if (selectedPowerMoveExtra > 0) trickDetails.displayName += ` (+${selectedPowerMoveExtra}p)`;
            
            // El finalScore se calculará en updateAllScoresAndUI usando la nueva lógica de PM
        } else if (currentTab === "statics") {
            // ... (lógica de estáticos se mantiene, numReps = 1) ...
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
        } else if (currentTab === "freestyle" || currentTab === "balance") {
            // ... (lógica de freestyle/balance se mantiene, numReps = 1) ...
            const baseTrickDef = defaultTricksByTab[currentTab].find(t => t.name === selectedRecommendedTrickName);
            trickDetails.nameForRepetition = selectedRecommendedTrickName;
            trickDetails.basePoints = baseTrickDef.base;
            trickDetails.displayName = selectedRecommendedTrickName;
        }
        
        addTrickToParticipant(trickDetails);
        hideAndResetRecommendedControls();
        if (currentTab === "powermoves") { pm_staticElement = null; buildPowerMoveSelectors(); }
    }

    function handleAddCustomTrick(area) {
        const nameInput = document.getElementById(`custom${capitalize(area)}TrickName`);
        const costInput = document.getElementById(`custom${capitalize(area)}TrickCost`);
        const cleanlinessInput = document.getElementById(`custom${capitalize(area)}TrickCleanliness`);

        const trickName = nameInput.value.trim();
        const trickCost = parseFloat(costInput.value); // Para PMs, este es el coste POR REPETICIÓN
        const cleanVal = parseInt(cleanlinessInput.value) || 10;
        let numReps = 1;

        if (area === "powermoves") {
            const repsInput = document.getElementById(`customPowermovesTrickReps`);
            numReps = parseInt(repsInput.value) || 1;
        }

        if (!trickName || isNaN(trickCost) || trickCost <= 0) {
            showToast("Nom i cost base (positiu) són requerits.", "error"); return;
        }
        const difficultyMult = getDifficultyMultiplierVal();
        let trickDetails = {
            area: area,
            nameForRepetition: `Custom-${area}-${trickName}`, // Para contar SETS
            displayName: `${trickName} (Custom)${area === "powermoves" ? ` [${numReps} reps]` : ""}`,
            basePoints: trickCost, // Para PMs, este es el base POR REP.
            cleanScore: cleanVal,
            difficultyMultiplierApplied: difficultyMult,
            repetitionFactor: 1, 
            staticModifierName: 'N/A', staticModifierValue: 1, // Custom no usan mod de lista
            extraPointsValue: 0,
            isCustom: true,
            numReps: numReps
        };

        if (area === "powermoves") trickDetails.isPowerMove = true;
        
        addTrickToParticipant(trickDetails);
        nameInput.value = ''; costInput.value = ''; cleanlinessInput.value = 10;
        if (area === "powermoves") document.getElementById(`customPowermovesTrickReps`).value = 1;
    }

    function removeTrick(index) { /* ... se mantiene ... */ }
    
    function updateAllScoresAndUI() {
        const currentTricks = participantData[currentParticipant].tricks;
        const recalculatedTricks = [];
        const runningTrickCounts = {}; 

        for (const trick of currentTricks) {
            const trickRepetitionId = trick.nameForRepetition; // ID para contar SETS de trucos
            runningTrickCounts[trickRepetitionId] = (runningTrickCounts[trickRepetitionId] || 0) + 1;
            const setCountForThisTrickType = runningTrickCounts[trickRepetitionId];

            let finalScoreForTrickSet;
            let currentSetRepetitionFactor = 1; // Penalización para SETS enteros del mismo truco

            // Aplicar penalización para SETS del mismo tipo de truco (Freestyle, Statics, Balance, y SETS de PM)
            // Esta penalización es para cuando haces, por ejemplo, un "Front Lever" varias veces en la rutina.
            // La penalización interna de repeticiones de PM ya se maneja en calculatePowerMoveSetScore.
            if (trick.area !== "combos") { // Combos no se repiten de esta forma
                if (setCountForThisTrickType === 2) currentSetRepetitionFactor = 0.66;
                else if (setCountForThisTrickType === 3) currentSetRepetitionFactor = 0.33;
                else if (setCountForThisTrickType > 3) currentSetRepetitionFactor = 0;
            }

            if (trick.isPowerMove) {
                finalScoreForTrickSet = calculatePowerMoveSetScore(
                    trick.basePoints, // Base por rep individual
                    trick.numReps,
                    trick.cleanScore,
                    trick.staticModifierValue, // Modificador de posición (Tuck, Full, etc.)
                    trick.extraPointsValue,
                    trick.difficultyMultiplierApplied
                );
            } else { // Para Freestyle, Statics, Balance (que son 1 rep por entrada)
                let score = trick.basePoints;
                if (trick.area === "statics" && !trick.isSuperStatic && !trick.isCustom) {
                    score *= trick.staticModifierValue;
                }
                score *= trick.difficultyMultiplierApplied;
                score *= (trick.cleanScore / 10);
                score += trick.extraPointsValue;
                finalScoreForTrickSet = score;
            }
            
            finalScoreForTrickSet *= currentSetRepetitionFactor; // Aplicar penalización al SET completo
            
            recalculatedTricks.push({ 
                ...trick, 
                finalScore: Math.max(0, finalScoreForTrickSet), 
                repetitionFactor: currentSetRepetitionFactor // Este es el factor del SET
            });
        }
        participantData[currentParticipant].tricks = recalculatedTricks;
        
        Object.keys(descriptions).forEach(key => updateAreaSubtotal(key));
        updateAreaSubtotal('combos'); // Actualizar subtotal de combos
        renderTricksList();
        updateTotalScore();
    }

    function getAreaScore(area) { /* ... se mantiene ... */ }
    function updateAreaSubtotal(areaKey) { /* ... se mantiene ... */ }
    
    function updateComboScoreAndTotal() {
        let comboScore = 0;
        const comboCriteria = participantData[currentParticipant].directScores.comboCriteria;

        // Sumar puntos de los 9 criterios base
        const criteriaIds = [
            'comboCritFreestyle', 'comboCritStatics', 'comboCritPowermoves', 'comboCritBalance',
            'comboCritUnbroken', 'comboCritDeadStop', 'comboCritCleanExecution', 'comboCritCombinations', 'comboCritFluidity'
        ];
        criteriaIds.forEach(id => {
            if (comboCriteria[id]) { // Si el checkbox está marcado
                comboScore += 1; // Cada criterio base da 1 punto
            }
        });

        // Aplicar modificadores
        if (comboCriteria.perfectionPoint) {
            comboScore += 1;
        }
        if (comboCriteria.lowCleanlinessPenalty) {
            comboScore -= 0.5;
        }
        
        comboScore = Math.max(0, comboScore); // Asegurar que no sea negativo
        participantData[currentParticipant].directScores.combos = Math.min(comboScore, maxScoresPerArea.combos);
        
        updateAreaSubtotal('combos');
        updateTotalScore();
    }

    function updateTotalScore() { /* ... se mantiene ... */ }

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
            let detailsText = `Base: ${trick.basePoints.toFixed(2)}, Neteja: ${trick.cleanScore}/10, Set Rep. x${trick.repetitionFactor.toFixed(2)}`;
            if (trick.isPowerMove) {
                detailsText += `, ${trick.numReps} reps intern.`;
            }
            detailsText += `, Score: ${trick.finalScore.toFixed(2)}`;

            li.innerHTML = `
                <div class="trick-info">
                    <span class="trick-name">${trick.displayName} <span class="trick-area-badge">${trick.area}</span></span>
                    <span class="trick-details">${detailsText}</span>
                </div>
                <button class="button button-destructive small-btn" data-index="${index}" title="Eliminar truc">✕</button>
            `;
            li.querySelector('.button-destructive').addEventListener('click', () => removeTrick(index));
            tricksListElement.appendChild(li);
        });
    }
    
    function buildPowerMoveSelectors() { /* ... (adaptar para la nueva UI de reps si es necesario, pero el input de reps está fuera) ... */ }
    function createSelectForPM(optionsArray, placeholderText, currentValue, onChangeCallback) { /* ... se mantiene ... */ }
    function createSelectWithOptionsForPM(optionsData, currentValue, textFn, valueFn, onChangeCallback) { /* ... se mantiene ... */ }

    function handleSaveParticipantScore() { /* ... (adaptar para comboCriteria en summary) ... */
        if (participantData[currentParticipant].tricks.length === 0 && participantData[currentParticipant].directScores.combos === 0) {
            showToast(`No hi ha puntuacions per guardar per al Participant ${currentParticipant}.`, "error");
            return;
        }
        const summaryData = {
            participantId: currentParticipant,
            difficulty: difficulty,
            difficultyMultiplier: getDifficultyMultiplierVal(),
            tricks: JSON.parse(JSON.stringify(participantData[currentParticipant].tricks)),
            comboCriteriaSnapshot: JSON.parse(JSON.stringify(participantData[currentParticipant].directScores.comboCriteria)), // Guardar estado de combos
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
        scoreSummarySection.classList.add('visible');
        scoreSummarySection.scrollIntoView({ behavior: 'smooth' });
        showToast(`Puntuació del Participant ${currentParticipant} finalitzada.`, "success");
    }

    function displayScoreSummary(participantId) {
        const summary = savedScores[participantId];
        if (!summary) return;
        summaryParticipantNameElement.textContent = `Resum Participant ${participantId}`;
        let tableHTML = `
            <h4>Detall de Trucs:</h4>
            <table>
                <thead>
                    <tr>
                        <th>Truc</th><th>Àrea</th><th>Base</th><th>Neteja</th><th>Reps</th>
                        <th>Mod.</th><th>Extra</th><th>xDiff</th><th>xSetRep</th><th>Score Final</th>
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
                    <td>${trick.numReps || 1}</td>
                    <td>${trick.staticModifierName !== 'N/A' ? `${trick.staticModifierName} (x${trick.staticModifierValue.toFixed(2)})` : '-'}</td>
                    <td>${trick.extraPointsValue.toFixed(2)}</td>
                    <td>x${trick.difficultyMultiplierApplied.toFixed(2)}</td>
                    <td>x${trick.repetitionFactor.toFixed(2)}</td>
                    <td><strong>${trick.finalScore.toFixed(2)}</strong></td>
                </tr>`;
        });
        tableHTML += `</tbody></table>
                      <h4>Detall de Combos:</h4>
                      <p>`;
        const comboCriteriaIds = {
            comboCritFreestyle: "Freestyle", comboCritStatics: "Estàtics", comboCritPowermoves: "PowerMoves", 
            comboCritBalance: "Balance", comboCritUnbroken: "Unbroken", comboCritDeadStop: "DeadStop", 
            comboCritCleanExecution: "Limpieza Combo", comboCritCombinations: "Combinacions", comboCritFluidity: "Fluidesa"
        };
        Object.keys(comboCriteriaIds).forEach(id => {
            if (summary.comboCriteriaSnapshot && summary.comboCriteriaSnapshot[id]) {
                tableHTML += `${comboCriteriaIds[id]}: +1p<br>`;
            }
        });
        if (summary.comboCriteriaSnapshot && summary.comboCriteriaSnapshot.perfectionPoint) tableHTML += `Perfecció: +1p<br>`;
        if (summary.comboCriteriaSnapshot && summary.comboCriteriaSnapshot.lowCleanlinessPenalty) tableHTML += `Neteja Baixa: -0.5p<br>`;
        tableHTML += `</p>
                      <h4>Subtotals i Total:</h4>
                      <table><tbody>`; // Reusar estructura de tabla para subtotales
        Object.keys(summary.subtotals).forEach(area => {
            let areaDisplayName = capitalize(area);
            let subtotalValue = summary.subtotals[area];
            if (area === "powermoves" && summary.pmBonus > 0) {
                areaDisplayName += " (+1 Bonus Reps)";
            }
             tableHTML += `<tr><td colspan="8" style="text-align:right;">Subtotal ${areaDisplayName}:</td><td><strong>${subtotalValue.toFixed(2)}</strong></td></tr>`;
        });
        tableHTML += `<tr class="grand-total"><td colspan="8" style="text-align:right;">TOTAL PARTICIPANT (${participantId}):</td><td><strong>${summary.grandTotal.toFixed(2)}</strong></td></tr>`;
        tableHTML += `</tbody></table>`;
        scoreTableContainer.innerHTML = tableHTML;
    }

    function handleDownloadCsv() {
        const summary = savedScores[currentParticipant];
        if (!summary) { showToast("No hi ha resum per descarregar.", "error"); return; }
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Participant,Dificultat\r\n";
        csvContent += `${summary.participantId},${summary.difficulty} (x${summary.difficultyMultiplier.toFixed(2)})\r\n\r\n`;
        csvContent += "Categoria Truc,Nom Truc,Punts Base,Neteja,Num Reps,Modificador Nom,Modificador Valor,Punts Extra,Factor Repetició Set,Score Final Truc\r\n";
        summary.tricks.forEach(trick => {
            const row = [
                capitalize(trick.area), `"${trick.displayName.replace(/"/g, '""')}"`,
                trick.basePoints.toFixed(2), `${trick.cleanScore}/10`, trick.numReps || 1,
                trick.staticModifierName, trick.staticModifierValue.toFixed(2),
                trick.extraPointsValue.toFixed(2), trick.repetitionFactor.toFixed(2),
                trick.finalScore.toFixed(2)
            ].join(",");
            csvContent += row + "\r\n";
        });
        csvContent += "\r\n";
        csvContent += "Criteris Combo,,,,,,,,,Punts\r\n";
        const comboCriteriaIds = { /* ... (igual que en displayScoreSummary) ... */ };
        let comboDetailScore = 0;
        if(summary.comboCriteriaSnapshot){
            Object.keys(comboCriteriaIds).forEach(id => {
                if (summary.comboCriteriaSnapshot[id]) { csvContent += `${comboCriteriaIds[id]},,,,,,,,,+1\r\n`; comboDetailScore +=1; }
            });
            if (summary.comboCriteriaSnapshot.perfectionPoint) { csvContent += `Perfecció Extra,,,,,,,,,+1\r\n`; comboDetailScore +=1;}
            if (summary.comboCriteriaSnapshot.lowCleanlinessPenalty) { csvContent += `Penalització Neteja Baixa,,,,,,,,,-0.5\r\n`; comboDetailScore -=0.5;}
        }
        csvContent += `Subtotal Calculat Combos (detall),,,,,,,,,${comboDetailScore.toFixed(2)}\r\n`; // Para verificación
        csvContent += "\r\n";

        Object.keys(summary.subtotals).forEach(area => {
            let areaDisplayName = capitalize(area);
            if (area === "powermoves" && summary.pmBonus > 0) areaDisplayName += " (+1 Bonus Reps)";
            csvContent += `Subtotal ${areaDisplayName},,,,,,,,,${summary.subtotals[area].toFixed(2)}\r\n`;
        });
        csvContent += `TOTAL PARTICIPANT ${summary.participantId},,,,,,,,,${summary.grandTotal.toFixed(2)}\r\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `puntuacion_participant_${summary.participantId}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        showToast("CSV descarregat!", "success");
    }

    function capitalize(s) { /* ... se mantiene ... */ }
    function showToast(message, type = 'info') { /* ... se mantiene ... */ }

    initialize();
});
