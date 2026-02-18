# Schienen-Legespiel - Spielplan

## Übersicht

Ein 2D-Puzzle-Spiel im Browser. Der Spieler platziert Gleisplättchen auf einem Grid, um Städte miteinander zu verbinden. Inspiriert von Carcassonne.

## Tech-Stack

- **Sprache:** TypeScript (Vanilla, kein Framework)
- **Grafik:** SVG (inline im DOM)
- **Bundler:** Vite
- **Zielplattform:** Desktop-Browser

## Spielfeld

- Festes 5x5 Grid
- Zu Spielbeginn werden **3 Städte mit Bahnhof** zufällig platziert
- Jede Stadt hat zufällig **1 oder 2 Gleisausgänge**
- Restliche Zellen starten leer
- Zellen dürfen leer bleiben

## Plättchen-Typen

### Vom Spieler platzierbar

| Typ             | Gleiskanten        | Interne Verbindung                              | Beschreibung                          |
| --------------- | ------------------ | ------------------------------------------------ | ------------------------------------- |
| **Gerade**      | 2 (gegenüber)      | A↔C                                              | Gerade Schiene                        |
| **Kurve**       | 2 (benachbart)     | A↔B (90°)                                        | Schiene biegt 90° ab                  |
| **Weiche**      | 3 (T-Form)         | Alle 3 verbunden (Gerade + Abzweigung)           | Gerade mit abzweigender Kurve         |
| **Gleisdreieck**| 3 (Y-Form)         | Alle 3 verbunden (3 Kurven)                      | Dreieckige Verbindung dreier Gleise   |
| **Kreuzung**    | 4                  | 2 unabhängige Strecken (↕ und ↔ nicht verbunden) | Zwei kreuzende, getrennte Gleise      |

### Vorplatziert

| Typ                  | Gleiskanten | Beschreibung                    |
| -------------------- | ----------- | ------------------------------- |
| **Stadt (1 Ausgang)**| 1           | Endpunkt einer Strecke          |
| **Stadt (2 Ausgänge)**| 2          | Durchgangsstation               |

### Kantenmodell

Jede Zelle hat 4 Kanten: **Top (T), Right (R), Bottom (B), Left (L)**. Jede Kante ist entweder `track` oder `empty`.

#### Basis-Definitionen (Rotation 0°)

```
Gerade:         T=track, R=empty, B=track, L=empty    → Verbindung: T↔B
Kurve:          T=track, R=track, B=empty, L=empty     → Verbindung: T↔R
Weiche:         T=track, R=track, B=track, L=empty     → Verbindungen: T↔B, T↔R, B↔R
Gleisdreieck:   T=track, R=track, B=track, L=empty     → Verbindungen: T↔R, R↔B, T↔B
Kreuzung:       T=track, R=track, B=track, L=track     → Verbindungen: T↔B, R↔L (getrennt!)
Stadt 1-Exit:   B=track                                → Endpunkt
Stadt 2-Exit:   T=track, B=track                       → Verbindung: T↔B
```

> **Weiche vs. Gleisdreieck:** Gleiche Anzahl Kanten, gleiche Konnektivität (alle 3 verbunden), aber unterschiedliche visuelle Darstellung. Weiche hat eine dominante Gerade + Abzweigung, Gleisdreieck hat 3 Kurven.

#### Rotation

Jedes Plättchen kann in 4 Stufen rotiert werden (0°, 90°, 180°, 270°). Rotation verschiebt die Kanten im Uhrzeigersinn:

- 0°: `[T, R, B, L]`
- 90°: `[L, T, R, B]`
- 180°: `[B, L, T, R]`
- 270°: `[R, B, L, T]`

## Spielregeln

1. **Platzierung:** Spieler wählt einen Plättchen-Typ, rotiert ihn optional, und platziert ihn auf eine leere Zelle
2. **Kantenregel:** Benachbarte Zellen müssen an der gemeinsamen Kante übereinstimmen:
   - Gleis ↔ Gleis ✅
   - Leer ↔ Leer ✅
   - Gleis ↔ Leer ❌
3. **Leere Nachbarn:** Eine Gleiskante neben einer leeren Zelle (ohne Plättchen) ist erlaubt
4. **Entfernen:** Spieler kann platzierte Plättchen wieder entfernen
5. **Städte:** Vorplatzierte Städte können nicht verschoben oder entfernt werden

## Gewinnbedingung

- Alle **3 Städte** müssen über die **interne Gleisführung** miteinander verbunden sein
- Verbindung wird per Graph-Traversierung (BFS/DFS) geprüft, wobei die internen Verbindungen der Plättchen den Graphen definieren
- Keine Kantenregel-Verletzungen im gesamten Grid

## Konnektivitäts-Graph

Für die Gewinnprüfung wird ein Graph aus den internen Verbindungen aufgebaut:

- **Knoten:** Jede Kante jeder belegten Zelle (z.B. `(2,3,Top)`)
- **Interne Kanten:** Gemäß Plättchen-Typ und Rotation (z.B. Gerade verbindet `(x,y,Top)` mit `(x,y,Bottom)`)
- **Externe Kanten:** Zwischen benachbarten Zellen (z.B. `(2,3,Right)` ↔ `(3,3,Left)`)
- **Städte** sind spezielle Knoten im Graph
- BFS/DFS von Stadt 1 aus prüfen ob Stadt 2 und Stadt 3 erreichbar sind

## UI-Konzept

### Layout

```
┌─────────────────────────────────┐
│          Schienen-Puzzle         │
├──────────┬──────────────────────┤
│          │                      │
│ Plättchen│     5x5 Spielfeld    │
│ Auswahl  │                      │
│          │                      │
│ [Gerade] │  [ ][ ][ ][ ][ ]    │
│ [Kurve]  │  [ ][ ][🏙][ ][ ]   │
│ [Weiche] │  [ ][ ][ ][ ][ ]    │
│ [Dreieck]│  [ ][🏙][ ][ ][ ]   │
│ [Kreuz]  │  [ ][ ][ ][ ][🏙]   │
│          │                      │
├──────────┴──────────────────────┤
│ [Rotation ↻]  [Prüfen ✓]       │
└─────────────────────────────────┘
```

### Interaktion

1. Plättchen-Typ in der Seitenleiste auswählen (Klick)
2. Plättchen mit Taste oder Button rotieren
3. Auf leere Zelle klicken → Plättchen wird platziert
4. Auf platziertes Plättchen klicken → Plättchen entfernen
5. "Prüfen"-Button → Validierung + Gewinnprüfung

### SVG-Darstellung

- Jede Zelle ist ein SVG-Quadrat (z.B. 80x80px)
- Gleise werden als Pfade/Linien gezeichnet (Strichstärke ~6px)
- Städte als farbige Rechtecke mit Symbol
- Hover-Effekt auf leere Zellen wenn Plättchen ausgewählt
- Farbliche Markierung bei Kantenregel-Verletzung

## Projektstruktur

```
ezs/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts              # Einstiegspunkt, initialisiert Spiel
│   ├── types.ts              # TypeScript-Typen und Interfaces
│   ├── tiles.ts              # Plättchen-Definitionen (Kanten, Verbindungen)
│   ├── grid.ts               # Grid-Logik (Platzierung, Entfernung, Nachbarn)
│   ├── validation.ts         # Kantenprüfung + Konnektivitätsprüfung
│   ├── renderer.ts           # SVG-Rendering des Spielfelds
│   ├── ui.ts                 # UI-Interaktion (Auswahl, Rotation, Events)
│   ├── generator.ts          # Spielfeld-Generierung (Städte platzieren)
│   └── style.css             # Styling
```

## Implementierungs-Reihenfolge

1. **Projekt-Setup:** Vite + TypeScript initialisieren
2. **Typen & Plättchen:** Datenmodell und Plättchen-Definitionen
3. **Grid-Logik:** Grid erstellen, Plättchen platzieren/entfernen
4. **SVG-Rendering:** Spielfeld und Plättchen zeichnen
5. **UI-Interaktion:** Plättchen auswählen, rotieren, platzieren
6. **Validierung:** Kantenprüfung implementieren
7. **Konnektivitätsprüfung:** BFS/DFS für Gewinnbedingung
8. **Spielfeld-Generierung:** Zufällige Städte-Platzierung
9. **Polish:** Visuelles Feedback, Gewinn-Anzeige, Neues Spiel
