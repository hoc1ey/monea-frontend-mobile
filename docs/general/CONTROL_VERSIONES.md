## 4. Manejo de ramas y commits

### 4.1 Ramas permanentes
| Rama | Propósito | Protección |
|---|---|---|
| `main` | código en producción (builds publicados) | PR obligatorio, sin commits directos |
| `develop` | integración de features | PR obligatorio, CI en verde |

### 4.2 Ramas de trabajo
- **Features:** `feature/NN-nombre` (NN = número de feature, de dos dígitos). Salen de `develop` y regresan a `develop` vía PR con **squash merge**.
- **Correcciones:** `fix/NN-descripcion` para bugs detectados en una feature ya integrada.
- **Publicación:** `release/vX.Y.Z` desde `develop`; al cerrar, merge a `main` y a `develop`, y tag `vX.Y.Z`.
- **Hotfix:** `hotfix/descripcion` desde `main`; merge a `main` y `develop`.

Flujo de una feature:
```bash
git checkout develop && git pull
git checkout -b feature/06-accounts
# ... commits ...
git push -u origin feature/06-accounts
# PR -> develop (squash merge) -> borrar rama
```

### 4.3 Convención de commits (Conventional Commits)
Formato: `tipo(ámbito): descripción en imperativo, minúsculas, sin punto`.

| Tipo | Uso |
|---|---|
| `feat` | nueva funcionalidad visible |
| `fix` | corrección |
| `style` | solo estilos/tokens sin cambio de lógica |
| `refactor` | reorganización sin cambio de comportamiento |
| `chore` | configuración, dependencias, tooling |
| `test` | pruebas |
| `docs` | documentación |

Ámbitos sugeridos: `config`, `ui`, `nav`, `auth`, `push`, `home`, `accounts`, `cards`, `movements`, `deferred`, `recurring`, `collections`, `loans`, `debts`, `shopping`, `manage`, `settings`, `api`.

Reglas:
- Un commit = un paso lógico que compila y funciona.
- Commits de las features en el orden de la sección 5.
- `commitlint` + `husky` (F16) validan el formato en el hook `commit-msg`.
- Nunca commitear `.env`, `google-services.json` (ver F04) ni claves.

---
