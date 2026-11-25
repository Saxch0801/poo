# Gestor de productos

Aplicación web con servidor **Node.js** (sin dependencias), datos guardados en **archivos JSON** y
**estructuras de datos implementadas a mano** (lista enlazada, tabla hash, pila y cola).

## Cómo correrlo
Necesitas Node 18 o superior.

```bash
npm start            # o: node server/server.js
```
Abre http://127.0.0.1:3000. Los archivos de datos se crean solos en `data/`.
Variables opcionales: `PORT` y `HOST`.

## Estructuras de datos y dónde se usan
| Estructura | Archivo | Para qué sirve |
|---|---|---|
| Lista doblemente enlazada | `server/structures/LinkedList.js` | Guarda los productos; borrar un nodo conocido es O(1) |
| Tabla hash (encadenamiento) | `server/structures/HashTable.js` | Busca por id y por código en O(1), evita códigos repetidos, y guarda los usuarios por correo |
| Pila (LIFO) | `server/structures/Stack.js` | Botón **Deshacer**: la última acción es la primera que se revierte |
| Cola circular (FIFO) | `server/structures/Queue.js` | **Actividad reciente**: guarda las últimas 15 acciones |

`server/services/Inventory.js` junta las cuatro estructuras en el inventario de cada usuario.

## Archivos de datos
- `data/usuarios.json`: cuentas (contraseña con scrypt + sal, nunca en texto plano)
- `data/productos.json`: productos, bitácora y siguiente id de cada usuario

`FileStorage` escribe en un archivo temporal y lo renombra, para no dejar el archivo a medias si algo falla.

## Estructura
```
server/
  server.js              servidor HTTP, rutas /api y archivos estáticos
  errors.js
  structures/            LinkedList · HashTable · Stack · Queue
  storage/FileStorage.js lectura y escritura de archivos JSON
  services/
    AuthService.js       registro, login, sesiones por cookie
    Inventory.js         inventario por usuario (usa las estructuras)
shared/                  config y validación, usadas por navegador y servidor
public/                  interfaz (HTML, CSS y clases JS)
  js/apiClient.js        comunicación con el servidor
  js/ui/                 Toast · Header · AuthView · ProductForm · ProductList · ActivityLog
```

## API
| Método y ruta | Acción |
|---|---|
| `POST /api/register`, `/api/login`, `/api/logout` | Cuenta y sesión |
| `GET /api/me` | Usuario actual |
| `GET /api/productos?q=&cat=&sort=` | Listar, buscar y ordenar |
| `POST /api/productos` | Alta |
| `PUT /api/productos/:id` | Edición |
| `DELETE /api/productos/:id` | Baja |
| `POST /api/deshacer` | Deshacer la última acción |

## ¿Y MySQL?
El navegador no puede conectarse directo a MySQL; siempre hace falta un servidor en medio, que es lo que
hace `server/`. Para pasar a MySQL solo habría que reemplazar `FileStorage` y cargar/guardar con consultas
SQL en vez de JSON; la interfaz y la API no cambian.

## Límites
- Escribe el archivo completo en cada cambio y corre en un solo proceso: sirve para una tienda pequeña o un
  proyecto escolar, no para muchos usuarios a la vez.
- Las sesiones viven en memoria: si reinicias el servidor, hay que volver a iniciar sesión.
- Para ponerlo en internet usa HTTPS y agrega `Secure` a la cookie en `server/server.js`.
