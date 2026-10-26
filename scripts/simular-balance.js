// Simulación de equilibrio: juega partidas completas sin pantalla con el motor real
// y con varias estrategias de jugador, para comprobar que el juego se puede ganar
// (y que no se gana sin hacer nada). Uso: npm run simular
const GameEngine = require('../src/core/GameEngine.js');

const DT = 1 / 60;
const LIMITE_TICKS = 60 * 60 * 40;

// Casillas entre dos tramos del camino: cubren dos tramos a la vez.
const CENTRO = [
    [4, 3], [8, 3], [12, 3], [16, 3], [4, 4], [8, 4], [12, 4], [16, 4],
    [4, 6], [8, 6], [12, 6], [16, 6], [4, 7], [8, 7], [12, 7], [16, 7],
];

const ESTRATEGIAS = {
    'Sin torres': { torres: [] },
    'Novato (4 ballestas)': { torres: CENTRO.slice(0, 4).map(([c, r]) => ['Ballesta', c, r]) },
    'Medio (8 mixtas)': { torres: CENTRO.slice(0, 8).map(([c, r], i) => [['Ballesta', 'Canon', 'Escarcha', 'Arcana'][i % 4], c, r]) },
    'Medio con mejoras': { torres: CENTRO.slice(0, 8).map(([c, r], i) => [['Ballesta', 'Canon', 'Escarcha', 'Arcana'][i % 4], c, r]), mejorar: true },
    'Solo ballestas': { torres: CENTRO.map(([c, r]) => ['Ballesta', c, r]), mejorar: true },
    'Mixta': { torres: CENTRO.map(([c, r], i) => [['Ballesta', 'Canon', 'Escarcha', 'Arcana'][i % 4], c, r]), mejorar: true },
    'Ballestas y arcanas': { torres: CENTRO.map(([c, r], i) => [i % 2 ? 'Arcana' : 'Ballesta', c, r]), mejorar: true },
    'Cañones y escarcha': { torres: CENTRO.map(([c, r], i) => [i % 3 === 2 ? 'Escarcha' : 'Canon', c, r]), mejorar: true },
};

function play({ torres, mejorar = false }) {
    const engine = new GameEngine();
    const pendientes = [...torres];
    let ticks = 0;
    while (engine.state !== 'VICTORY' && engine.state !== 'DEFEAT' && ticks < LIMITE_TICKS) {
        if (!engine.waveManager.isWaveActive) engine.startNextWave();
        while (pendientes.length > 0 && engine.placeTower(...pendientes[0])) pendientes.shift();
        if (mejorar && pendientes.length === 0) {
            const porNivel = [...engine.towers].sort((a, b) => a.level - b.level);
            for (const tower of porNivel) {
                if (tower.level < 3 && engine.upgradeTower(tower.id)) break;
            }
        }
        engine.tick(DT);
        ticks += 1;
    }
    return {
        estado: engine.state,
        oleada: engine.waveManager.currentWaveIndex,
        vidas: engine.lives,
        torres: engine.towers.length,
        puntuacion: engine.calculateFinalScore(),
    };
}

function main() {
    console.log('Estrategia'.padEnd(22), 'Resultado'.padEnd(9), 'Oleada', 'Vidas', 'Torres', 'Puntuación');
    for (const [nombre, estrategia] of Object.entries(ESTRATEGIAS)) {
        const r = play(estrategia);
        console.log(nombre.padEnd(22), r.estado.padEnd(9), String(r.oleada).padStart(4) + '/10', String(r.vidas).padStart(5), String(r.torres).padStart(6), String(r.puntuacion).padStart(10));
    }
}

// La lógica se exporta para que CA-18 la reutilice sin duplicarla.
module.exports = { play, ESTRATEGIAS, CENTRO, DT, LIMITE_TICKS };

if (require.main === module) {
    main();
}
