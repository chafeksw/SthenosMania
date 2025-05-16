document.addEventListener('DOMContentLoaded', () => {
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
        combos: [], // Combos son ahora manejados directamente por checkboxes
    };
    const descriptions = {
        freestyle: "Creativitat, ús variat de moviments i originalitat. Màxim 10 punts.",
        statics: "Elements estàtics. Selecciona un modificador i extres. Màxim 10 punts.",
        powermoves: "Moviments explosius. La puntuació per repetició disminueix segons el número. Màxim 10 punts.",
        balance: "Moviments d'equilibri. Màxim 5 punts.",
        combos: "Puntua segons els criteris marcats. Màxim 10 punts.",
    };
    const maxScoresPerArea = {
        freestyle: 10, statics: 10, powermoves: 10, balance: 5, combos: 10,
    };

    let currentParticipant = "A";
    let difficulty = "amateur";
    let participantData = {
        A: { tricks: [], directScores: { combos: 0 }, comboCriteria: {}, difficulty: "amateur" },
        B: { tricks: [], directScores: { combos: 0 }, comboCriteria: {}, difficulty: "amateur" }
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

    const recommendedTrickAddControlsSection = document.getElementById('recommendedTrickAddControlsSection');
    const addRecommendedTrickTitleElement = document.getElementById('addRecommendedTrickTitle');
    const selectedRecommendedTrickDisplayElement = document.getElementById('selectedRecommendedTrickDisplay');
    const cleanlinessRecommendedInput = document.getElementById('cleanlinessRecommended');
    const powermoveRepsSection = document.getElementById('powermoveRepsSection');
    const powermoveRepsInput = document.getElementById('powermoveReps');
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

    // Combo Checkboxes
    const comboCheckboxesIds = [
        "comboCatFreestyle", "comboCatEstaticos", "comboCatPowerMoves", 
        "comboCatBalance", "comboCatUnbroken", "comboCatDeadStop", 
        "comboCatLimpieza", "comboCatCombinaciones", "comboCatFluidez", "comboPuntoExtra"
    ];

    function initialize() {
        participantAButton.addEventListener('click', () => switchParticipant('A'));
        participantBButton.addEventListener('click', () => switchParticipant('B'));
        
        difficultySelect.addEventListener('change', (e) => {
            difficulty = e.target.value;
            participantData[currentParticipant].difficulty = difficulty;
            updateAllScoresAndUI();
            showToast("Dificultat actualizada", "info");
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
        staticSuperExtraPointsSelect.value = selectedStaticExtra; // Default, can be different if needed
        staticSuperExtraPointsSelect.addEventListener('change', e => selectedStaticExtra = Number(e.target.value));


        ['freestyle', 'statics', 'balance'].forEach(area => populateRecommendedTricks(area));
        buildPowerMoveSelectors();
        
        comboCheckboxesIds.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    participantData[currentParticipant].comboCriteria[id] = checkbox.checked;
                    updateComboScoreAndTotal();
                });
            }
        });
        document.getElementById('applyComboPenalty').addEventListener('click', () => {
            // Ensure directScores.combos exists
            if (typeof participantData[currentParticipant].directScores.combos !== 'number') {
                participantData[currentParticipant].directScores.combos = 0;
            }
            const currentComboScore = calculateRawComboScore(); // Get score from checkboxes before penalty
            let penalizedScore = currentComboScore - 0.5; // Apply penalty to the checkbox-based score
            
            // We need to store the penalty state if we want it to persist or be toggleable
            // For now, it's a one-time application to the current checkbox sum.
            // If we want the "-0.5" to be a persistent state, we'd need another variable.
            // The challenge is if checkboxes change, the -0.5 should re-apply.
            // A simpler model might be: `comboScore = sum_checkboxes + (extra_point ? 1 : 0) - (penalty_active ? 0.5 : 0)`
            // For now, this just modifies the `directScores.combos`
            participantData[currentParticipant].directScores.combos = Math.max(0, (participantData[currentParticipant].directScores.combos || 0) - 0.5);

            updateAreaSubtotal('combos'); // This will use the value in directScores.combos
            updateTotalScore();
            showToast("Penalització de combo aplicada (-0.5p)", "info");
        });
        
        addRecommendedTrickButton.addEventListener('click', handleAddRecommendedTrickToList);
        
        ['Freestyle', 'Statics', 'Powermoves', 'Balance'].forEach(area => {
            const buttonId = `addCustom${capitalize(area)}TrickButton`;
            const buttonElement = document.getElementById(buttonId);
            if (buttonElement) {
                 buttonElement.addEventListener('click', () => handleAddCustomTrick(area.toLowerCase()));
            } else {
                console.warn(`Button with ID ${buttonId} not found.`);
            }
        });


        clearAllTricksButton.addEventListener('click', () => {
            if (confirm(`¿Segur que vols eliminar tots els trucs del participant ${currentParticipant}? Aquesta acció no es pot desfer.`)) {
                participantData[currentParticipant].tricks = [];
                // Reset combo criteria as well
                participantData[currentParticipant].comboCriteria = {};
                comboCheckboxesIds.forEach(id => {
                    const checkbox = document.getElementById(id);
                    if(checkbox) checkbox.checked = false;
                });
                participantData[currentParticipant].directScores.combos = 0;

                updateAllScoresAndUI();
                showToast("Tots els trucs i criteris de combo eliminats", "info");
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

    function switchParticipant(participantId) {
        if (currentParticipant === participantId && !scoreSummarySection.style.display === 'none') return;
        
        if (scoreSummarySection.style.display !== 'none' && savedScores[currentParticipant]) {
            // Ok to switch if already saved and summary is shown
        } else if (participantData[currentParticipant].tricks.length > 0 || Object.keys(participantData[currentParticipant].comboCriteria).some(k => participantData[currentParticipant].comboCriteria[k])) {
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
        difficulty = participantData[participantId].difficulty;
        difficultySelect.value = difficulty;

        comboCheckboxesIds.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                 checkbox.checked = !!participantData[participantId].comboCriteria[id];
            }
        });
        
        ['Freestyle', 'Statics', 'Powermoves', 'Balance'].forEach(area => {
            const capArea = capitalize(area);
            const nameInput = document.getElementById(`custom${capArea}TrickName`);
            const costInput = document.getElementById(`custom${capArea}TrickCost`);
            const cleanInput = document.getElementById(`custom${capArea}TrickCleanliness`);

            if (nameInput) nameInput.value = '';
            if (costInput) costInput.value = '';
            if (cleanInput) cleanInput.value = 10;

            if (area === 'powermoves') {
                const repsInput = document.getElementById(`custom${capArea}TrickReps`);
                if (repsInput) repsInput.value = 1;
            }
        });
        
        hideAndResetRecommendedControls();
        setCurrentTab(currentTab); 
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
        hideAndResetRecommendedControls();
        currentTab = tabName;
        tabTriggers.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabName));
        tabContents.forEach(c => {
            const isActive = c.id === `tabContent${capitalize(tabName)}`;
            c.style.display = isActive ? 'block' : 'none';
            if (isActive) {
                void c.offsetWidth; 
                c.classList.add('active-tab-content-animation');
            } else {
                c.classList.remove('active-tab-content-animation');
            }
        });
        updateUIForCurrentTab();
    }
    
    function hideAndResetRecommendedControls() {
        if (recommendedTrickAddControlsSection.parentNode && recommendedTrickAddControlsSection.parentNode !== document.body) {
             document.body.appendChild(recommendedTrickAddControlsSection);
        }
        recommendedTrickAddControlsSection.style.display = 'none';
        powermoveRepsSection.style.display = 'none'; // Hide powermove reps input specifically

        selectedRecommendedTrickName = null;
        newTrickConfig = { name: "", base: 0, clean: 10, modifierValue: 1, extraPointsValue: 0, powerMoveDetails: {} };
        cleanlinessRecommendedInput.value = 10;
        powermoveRepsInput.value = 1;
        selectedRecommendedTrickDisplayElement.textContent = "Selecciona un truc de la llista.";
        document.querySelectorAll('.recommended-tricks-grid .button.selected').forEach(btn => btn.classList.remove('selected'));
    }

    function updateUIForCurrentTab() {
        const isStaticTrickSelected = currentTab === 'statics' && selectedRecommendedTrickName;
        staticsModifiersSection.style.display = (isStaticTrickSelected && !defaultTricksByTab.statics.find(t => t.name === selectedRecommendedTrickName)?.isSuper) ? 'block' : 'none';
        staticsSuperMessage.style.display = (isStaticTrickSelected && defaultTricksByTab.statics.find(t => t.name === selectedRecommendedTrickName)?.isSuper) ? 'block' : 'none';

        const isPowerMoveConfigured = currentTab === 'powermoves' && pm_staticElement;
        powermoveRepsSection.style.display = (currentTab === 'powermoves' && (selectedRecommendedTrickName || isPowerMoveConfigured)) ? 'block' : 'none';


        if(isPowerMoveConfigured && recommendedTrickAddControlsSection.style.display === 'block') {
            selectedRecommendedTrickDisplayElement.textContent = `PM: ${capitalize(pm_category)} ${pm_exercise} ${pm_staticElement.originalStatic}`;
        }
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

        const sortedTricks = [...defaultTricksByTab[tabKey]].sort((a, b) => (b.base || 0) - (a.base || 0));
        
        container.innerHTML = '';
        sortedTricks.forEach(trick => {
            const button = document.createElement('button');
            button.classList.add('button');
            button.textContent = `${trick.name} (Base: ${trick.base}) ${trick.isSuper ? "[S]" : ""}`;
            button.addEventListener('click', () => {
                hideAndResetRecommendedControls();
                selectedRecommendedTrickName = trick.name; 
                pm_staticElement = null; 
                newTrickConfig.name = trick.name;
                newTrickConfig.base = trick.base;
                
                container.querySelectorAll('.button.selected').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');

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
                    selectedStaticExtra = 0; // Reset extra points for statics
                    staticExtraPointsSelect.value = selectedStaticExtra;
                    staticSuperExtraPointsSelect.value = selectedStaticExtra; // Also for super statics
                }
                updateUIForCurrentTab();
            });
            container.appendChild(button);
        });
    }

    function getDifficultyMultiplierVal() {
        const multipliers = { beginner: 1.5, amateur: 1, professional: 0.75 };
        return multipliers[difficulty] || 1;
    }
    
    function addTrickToParticipant(trickData) {
        participantData[currentParticipant].tricks.push(trickData);
        updateAllScoresAndUI();
        showToast(`"${trickData.displayName}" afegit!`, "success");
    }

    function getPowerMoveRepScoreFactor(repNumber) {
        if (repNumber <= 3) return 1;    // Reps 1, 2, 3
        if (repNumber === 4) return 0.66; // Rep 4
        if (repNumber === 5) return 0.33; // Rep 5
        return 0; // More than 5 reps (as per initial request, can be adjusted)
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
            staticModifierName: 'N/A', staticModifierValue: 1,
            extraPointsValue: 0,
            numReps: 1 // Default for non-powermoves
        };

        if (currentTab === "statics") {
            const baseTrickDef = defaultTricksByTab.statics.find(t => t.name === selectedRecommendedTrickName);
            trickDetails.nameForRepetition = selectedRecommendedTrickName; // Used for distinct trick penalty
            trickDetails.basePoints = baseTrickDef.base;
            trickDetails.isSuperStatic = baseTrickDef.isSuper === true;
            
            if (!trickDetails.isSuperStatic) {
                trickDetails.staticModifierValue = selectedStaticModifier;
                trickDetails.staticModifierName = staticModifiers.find(m => m.value === selectedStaticModifier)?.name || 'Full';
            }
            // For statics, extra points are applied per instance, not per rep
            trickDetails.extraPointsValue = selectedStaticExtra; 
            trickDetails.displayName = selectedRecommendedTrickName + 
                (trickDetails.isSuperStatic ? " (Super)" : ` (${trickDetails.staticModifierName})`) +
                (selectedStaticExtra > 0 ? ` +${selectedStaticExtra}p` : "");

        } else if (currentTab === "powermoves") {
            const reps = parseInt(powermoveRepsInput.value) || 1;
            trickDetails.numReps = reps;
            trickDetails.isPowerMove = true;

            if (pm_staticElement) { // Configured PM
                const staticInfoForPM = baseStatics[pm_staticElement.originalStatic];
                trickDetails.nameForRepetition = `PM-${pm_category}-${pm_exercise}-${pm_staticElement.originalStatic}`; // Unique ID for this PM type
                trickDetails.basePointsPerRep = staticInfoForPM / 3; // Base points for ONE rep
                
                trickDetails.staticModifierValue = selectedPowerMoveModifier;
                trickDetails.staticModifierName = staticModifiers.find(m => m.value === selectedPowerMoveModifier)?.name || 'Full';
                trickDetails.extraPointsValue = selectedPowerMoveExtra; // Extra points for the whole set of reps
                trickDetails.powerMoveDetails = { category: pm_category, exercise: pm_exercise, staticElementOriginalName: pm_staticElement.originalStatic };

                trickDetails.displayName = `${capitalize(pm_category)} ${pm_exercise} ${pm_staticElement.originalStatic} (${trickDetails.staticModifierName}) x${reps}` +
                    (selectedPowerMoveExtra > 0 ? ` +${selectedPowerMoveExtra}p` : "");
            } else if (selectedRecommendedTrickName) { // Recommended PM (if any were defined directly, currently not)
                const baseTrickDef = defaultTricksByTab.powermoves.find(t => t.name === selectedRecommendedTrickName); // Needs adjustment if PMs are structured differently
                if (!baseTrickDef) { showToast("Error: Truc de PowerMove recomanat no trobat.", "error"); return; }
                trickDetails.nameForRepetition = selectedRecommendedTrickName;
                trickDetails.basePointsPerRep = baseTrickDef.base; // Assuming 'base' is per rep for recommended PMs
                // Recommended PMs might not have modifiers/extras defined this way, adjust if needed
                trickDetails.displayName = `${selectedRecommendedTrickName} x${reps}`;
            }


        } else if (currentTab === "freestyle" || currentTab === "balance") {
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
        const trickCost = parseFloat(costInput.value); // This is base for one rep if powermove
        const cleanVal = parseInt(cleanlinessInput.value) || 10;

        if (!trickName || isNaN(trickCost) || trickCost <= 0) {
            showToast("Nom i cost base (positiu) són requerits.", "error");
            return;
        }
        const difficultyMult = getDifficultyMultiplierVal();
        let trickDetails = {
            area: area,
            nameForRepetition: `Custom-${area}-${trickName}`, // For distinct trick penalty
            displayName: `${trickName} (Custom)`,
            basePoints: area !== "powermoves" ? trickCost : undefined, // Set later for PM
            basePointsPerRep: area === "powermoves" ? trickCost : undefined,
            cleanScore: cleanVal,
            difficultyMultiplierApplied: difficultyMult,
            staticModifierName: 'N/A', staticModifierValue: 1,
            extraPointsValue: 0, // Custom tricks generally don't have listed extras
            isCustom: true,
            numReps: 1, // Default, override for PM
        };

        if (area === "powermoves") {
            trickDetails.isPowerMove = true;
            const repsInput = document.getElementById(`customPowermovesTrickReps`);
            const reps = parseInt(repsInput.value) || 1;
            trickDetails.numReps = reps;
            trickDetails.displayName = `${trickName} (Custom PM) x${reps}`;
            if(repsInput) repsInput.value = 1; // Reset reps input
        }
        
        addTrickToParticipant(trickDetails);
        if (nameInput) nameInput.value = ''; 
        if (costInput) costInput.value = ''; 
        if (cleanlinessInput) cleanlinessInput.value = 10;
    }

    function removeTrick(index) {
        participantData[currentParticipant].tricks.splice(index, 1);
        updateAllScoresAndUI();
        showToast("Truc eliminat.", "info");
    }
    
    function updateAllScoresAndUI() {
        const currentTricks = participantData[currentParticipant].tricks;
        const recalculatedTricks = [];
        const runningTrickRepetitionCounts = {}; // For distinct trick name penalties

        for (const trick of currentTricks) {
            const trickRepetitionId = trick.nameForRepetition; // ID for distinct trick penalties
            runningTrickRepetitionCounts[trickRepetitionId] = (runningTrickRepetitionCounts[trickRepetitionId] || 0) + 1;
            const countForDistinctTrickPenalty = runningTrickRepetitionCounts[trickRepetitionId];

            let distinctTrickRepetitionFactor = 1;
            // Standard repetition penalty for adding the *same named trick* multiple times
            // This does NOT apply to individual reps within a single PowerMove execution.
            if (!trick.isPowerMove) { // PowerMove scoring for reps is handled separately
                if (countForDistinctTrickPenalty === 2) distinctTrickRepetitionFactor = 0.66;
                else if (countForDistinctTrickPenalty === 3) distinctTrickRepetitionFactor = 0.33;
                else if (countForDistinctTrickPenalty > 3) distinctTrickRepetitionFactor = 0;
            }

            let singleBaseScore; // Score for one rep or one instance before any repetition factors

            if (trick.isPowerMove) {
                singleBaseScore = trick.basePointsPerRep; // Base for one rep
                if (trick.staticModifierValue) { // Apply PM modifier to each rep's base
                    singleBaseScore *= trick.staticModifierValue;
                }
            } else { // Statics, Freestyle, Balance
                singleBaseScore = trick.basePoints;
                if (trick.area === "statics" && !trick.isSuperStatic && !trick.isCustom) {
                    singleBaseScore *= trick.staticModifierValue;
                }
            }
            
            let totalScoreForTrickInstance = 0;

            if (trick.isPowerMove) {
                for (let i = 1; i <= trick.numReps; i++) {
                    const repScoreFactor = getPowerMoveRepScoreFactor(i);
                    totalScoreForTrickInstance += singleBaseScore * repScoreFactor;
                }
                // Extra points for PM are for the set, add after summing rep scores
                totalScoreForTrickInstance += trick.extraPointsValue; 
            } else {
                totalScoreForTrickInstance = singleBaseScore;
                // Extra points for non-PM are per instance
                totalScoreForTrickInstance += trick.extraPointsValue; 
                 // Apply distinct trick penalty for non-PM
                totalScoreForTrickInstance *= distinctTrickRepetitionFactor;
            }
            
            // Apply difficulty and cleanliness to the total for this instance
            totalScoreForTrickInstance *= trick.difficultyMultiplierApplied;
            totalScoreForTrickInstance *= (trick.cleanScore / 10);
            
            recalculatedTricks.push({ 
                ...trick, 
                finalScore: Math.max(0, totalScoreForTrickInstance), 
                distinctTrickRepetitionFactor: distinctTrickRepetitionFactor // Store for display if needed
            });
        }
        participantData[currentParticipant].tricks = recalculatedTricks;
        
        Object.keys(descriptions).forEach(key => updateAreaSubtotal(key));
        // updateComboScoreAndTotal(); // Called by checkbox listeners
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
            
            if (maxScoresPerArea[areaKey] !== undefined && score > maxScoresPerArea[areaKey]) {
                score = maxScoresPerArea[areaKey];
            }
             if (areaKey === "combos") { // Ensure combo direct score is also capped
                participantData[currentParticipant].directScores.combos = Math.min(score, maxScoresPerArea.combos);
            }
            subtotalElement.textContent = score.toFixed(2);
         }
    }
    
    function calculateRawComboScore() {
        let score = 0;
        comboCheckboxesIds.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox && checkbox.checked) {
                score += parseFloat(checkbox.dataset.value || 0);
            }
        });
        return score;
    }

    function updateComboScoreAndTotal() {
        let comboScoreFromCheckboxes = calculateRawComboScore();
        // The penalty button directly modifies directScores.combos, so we use that value if it's set.
        // This logic assumes penalty is applied on top of checkbox score.
        // For simplicity, let's re-evaluate: the score IS the sum of checkboxes + extra - (IF penalty active)
        // The penalty button directly modifies directScores.combos.
        // So, `directScores.combos` reflects the current state including penalties.
        // The checkboxes update `comboCriteria`. `updateComboScoreAndTotal` then re-calculates based on `comboCriteria`
        
        participantData[currentParticipant].directScores.combos = comboScoreFromCheckboxes;
        
        updateAreaSubtotal('combos'); // This will cap the score if needed.
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
            let detailsText = `Base: ${(trick.basePoints || trick.basePointsPerRep || 0).toFixed(2)}`;
            if (trick.isPowerMove) detailsText += ` x ${trick.numReps} reps`;
            detailsText += `, Neteja: ${trick.cleanScore}/10, Score: ${trick.finalScore.toFixed(2)}`;
            if (!trick.isPowerMove && trick.distinctTrickRepetitionFactor < 1) {
                 detailsText += `, Rep. Factor: x${trick.distinctTrickRepetitionFactor.toFixed(2)}`;
            }


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
    
    function buildPowerMoveSelectors() {
        const container = document.getElementById('powermoveSelectorContainer');
        if (!container) return;
        container.innerHTML = ''; 

        const title = document.createElement('h3');
        title.textContent = 'Configurar PowerMove (Recomanat):';
        container.appendChild(title);

        const categorySelect = createSelectForPM(Object.keys(defaultTricksByTab.powermoves), "1. Tipus", pm_category, (val) => {
            pm_category = val; pm_exercise = null; pm_staticElement = null; selectedRecommendedTrickName = null;
            hideAndResetRecommendedControls(); 
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
                opt.textContent = `${el.originalStatic} (Base/rep: ${(el.staticBase/3).toFixed(2)})`;
                if (pm_staticElement && pm_staticElement.originalStatic === el.originalStatic) opt.selected = true;
                staticElementSelect.appendChild(opt);
            });
            
            staticElementSelect.addEventListener('change', (e) => {
                const selectedName = e.target.value;
                selectedRecommendedTrickName = null; 
                if (selectedName) {
                    pm_staticElement = staticElementsForPM.find(s => s.originalStatic === selectedName) || null;
                    if (pm_staticElement) {
                        selectedPowerMoveModifier = staticModifiers.find(m => m.name === "Full").value;
                        selectedPowerMoveExtra = 0;
                        
                        const placeholder = document.getElementById(`powermovesRecommendedControlsPlaceholder`);
                        if (placeholder) {
                            placeholder.appendChild(recommendedTrickAddControlsSection);
                            recommendedTrickAddControlsSection.style.display = 'block';
                            addRecommendedTrickTitleElement.textContent = `Afegir PowerMove Configurat`;
                            selectedRecommendedTrickDisplayElement.textContent = `PM: ${capitalize(pm_category)} ${pm_exercise} ${pm_staticElement.originalStatic}`;
                            powermoveRepsSection.style.display = 'block'; // Show reps input for configured PM
                        }
                    } else {
                         hideAndResetRecommendedControls(); 
                    }
                } else { pm_staticElement = null; hideAndResetRecommendedControls(); }
                buildPowerMoveSelectors(); 
                updateUIForCurrentTab();
            });
            container.appendChild(staticElementSelect);
        }
        
        if (pm_staticElement) { // Only show these if a PM is fully configured
            const pmModifierLabel = document.createElement('label'); pmModifierLabel.className = 'label-modern';
            pmModifierLabel.textContent = "Modificador PM:"; container.appendChild(pmModifierLabel);
            const pmModifierSelect = createSelectWithOptionsForPM(staticModifiers, selectedPowerMoveModifier, m => `${m.name} (x${m.value})`, m => m.value, (val) => selectedPowerMoveModifier = Number(val));
            container.appendChild(pmModifierSelect);

            const pmExtraLabel = document.createElement('label'); pmExtraLabel.className = 'label-modern';
            pmExtraLabel.textContent = "Extra PM (set sencer):"; container.appendChild(pmExtraLabel);
            const pmExtraSelect = createSelectWithOptionsForPM(extraPointOptions, selectedPowerMoveExtra, o => o.name, o => o.value, (val) => selectedPowerMoveExtra = Number(val));
            container.appendChild(pmExtraSelect);
        }
        updateUIForCurrentTab(); // Ensure reps input visibility is correct
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
        const hasTricks = participantData[currentParticipant].tricks.length > 0;
        const hasComboScore = (participantData[currentParticipant].directScores.combos || 0) > 0;
        const hasAnyComboCriteria = Object.values(participantData[currentParticipant].comboCriteria).some(val => val === true);

        if (!hasTricks && !hasComboScore && !hasAnyComboCriteria) {
            showToast(`No hi ha puntuacions per guardar per al Participant ${currentParticipant}.`, "error");
            return;
        }

        const summaryData = {
            participantId: currentParticipant,
            difficulty: difficulty,
            difficultyMultiplier: getDifficultyMultiplierVal(),
            tricks: JSON.parse(JSON.stringify(participantData[currentParticipant].tricks)),
            subtotals: {},
            comboCriteriaSnapshot: JSON.parse(JSON.stringify(participantData[currentParticipant].comboCriteria)), // Save combo checkbox states
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
            <table>
                <thead>
                    <tr>
                        <th>Truc/Criteri</th><th>Àrea</th><th>Base</th><th>Neteja</th>
                        <th>Mod./Reps</th><th>Extra</th><th>xDiff</th><th>xRepFactor</th><th>Score Final</th>
                    </tr>
                </thead>
                <tbody>`;
        summary.tricks.forEach(trick => {
            let modRepsText = trick.staticModifierName !== 'N/A' ? `${trick.staticModifierName} (x${trick.staticModifierValue.toFixed(2)})` : '-';
            if (trick.isPowerMove) {
                modRepsText = `Reps: ${trick.numReps}`;
                if(trick.staticModifierName !== 'N/A') modRepsText += `, Mod: ${trick.staticModifierName} (x${trick.staticModifierValue.toFixed(2)})`;
            }
            tableHTML += `
                <tr>
                    <td>${trick.displayName}</td>
                    <td>${capitalize(trick.area)}</td>
                    <td>${(trick.basePoints || trick.basePointsPerRep || 0).toFixed(2)}</td>
                    <td>${trick.cleanScore}/10</td>
                    <td>${modRepsText}</td>
                    <td>${trick.extraPointsValue.toFixed(2)}</td>
                    <td>x${trick.difficultyMultiplierApplied.toFixed(2)}</td>
                    <td>${!trick.isPowerMove ? `x${(trick.distinctTrickRepetitionFactor || 1).toFixed(2)}` : '-'}</td>
                    <td><strong>${trick.finalScore.toFixed(2)}</strong></td>
                </tr>`;
        });
        // Display Combo Criteria in Summary
        if (summary.comboCriteriaSnapshot && Object.keys(summary.comboCriteriaSnapshot).length > 0) {
            tableHTML += `<tr><td colspan="9" style="background-color: #383838; color: #ccc; text-align:center;">Criteris de Combo Aplicats</td></tr>`;
            for (const criterion in summary.comboCriteriaSnapshot) {
                if (summary.comboCriteriaSnapshot[criterion]) {
                    const labelElement = document.querySelector(`label[for="${criterion}"]`);
                    const criterionName = labelElement ? labelElement.textContent.replace(/\(\+\dp\)/, '').trim() : capitalize(criterion.replace('comboCat', '').replace('comboPunto', 'Punto '));
                    const pointValue = document.getElementById(criterion)?.dataset.value || "0";
                    tableHTML += `
                        <tr>
                            <td>${criterionName}</td>
                            <td>Combo</td>
                            <td colspan="6">${pointValue > 0 ? `+${pointValue}p` : ''}</td>
                            <td>${pointValue > 0 ? `+${pointValue}.00` : ''}</td>
                        </tr>`;
                }
            }
        }


        tableHTML += `</tbody><tfoot>`;
        Object.keys(summary.subtotals).forEach(area => {
            tableHTML += `<tr><td colspan="8" style="text-align:right;">Subtotal ${capitalize(area)}:</td><td><strong>${summary.subtotals[area].toFixed(2)}</strong></td></tr>`;
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
        csvContent += "Truc/Criteri,Àrea,Punts Base,Neteja,Modificador/Reps,Punts Extra,Multiplicador Dificultat,Factor Repetició Distinct,Score Final\r\n";
        summary.tricks.forEach(trick => {
            let modRepsText = trick.staticModifierName !== 'N/A' ? `${trick.staticModifierName} (x${trick.staticModifierValue.toFixed(2)})` : '-';
            if (trick.isPowerMove) {
                 modRepsText = `Reps: ${trick.numReps}`;
                 if(trick.staticModifierName !== 'N/A') modRepsText += ` Mod: ${trick.staticModifierName} (x${trick.staticModifierValue.toFixed(2)})`;
            }
            const row = [
                `"${trick.displayName.replace(/"/g, '""')}"`, capitalize(trick.area),
                (trick.basePoints || trick.basePointsPerRep || 0).toFixed(2), `${trick.cleanScore}/10`,
                `"${modRepsText.replace(/"/g, '""')}"`, trick.extraPointsValue.toFixed(2),
                trick.difficultyMultiplierApplied.toFixed(2),
                !trick.isPowerMove ? (trick.distinctTrickRepetitionFactor || 1).toFixed(2) : '-', 
                trick.finalScore.toFixed(2)
            ].join(",");
            csvContent += row + "\r\n";
        });

        if (summary.comboCriteriaSnapshot && Object.keys(summary.comboCriteriaSnapshot).length > 0) {
            csvContent += "Criteris de Combo Aplicats,,,,,,,,\r\n";
            for (const criterion in summary.comboCriteriaSnapshot) {
                if (summary.comboCriteriaSnapshot[criterion]) {
                    const labelElement = document.querySelector(`label[for="${criterion}"]`);
                    const criterionName = labelElement ? labelElement.textContent.replace(/\(\+\dp\)/, '').trim() : capitalize(criterion.replace('comboCat', '').replace('comboPunto', 'Punto '));
                     const pointValue = document.getElementById(criterion)?.dataset.value || "0";
                    csvContent += `"${criterionName.replace(/"/g, '""')}",Combo,,,,,,,${pointValue > 0 ? pointValue+'.00' : ''}\r\n`;
                }
            }
        }

        csvContent += "\r\n";
        Object.keys(summary.subtotals).forEach(area => {
            csvContent += `Subtotal ${capitalize(area)},,,,,,,${summary.subtotals[area].toFixed(2)}\r\n`;
        });
        csvContent += `TOTAL PARTICIPANT ${summary.participantId} (Dificultat: ${summary.difficulty}),,,,,,,${summary.grandTotal.toFixed(2)}\r\n`;

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
        toastNotification.className = 'toast-notification ' + type; 
        void toastNotification.offsetWidth; 
        toastNotification.classList.add('show');
        
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3000);
    }

    initialize();
});
