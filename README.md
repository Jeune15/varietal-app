
# Varietal — Coffee Developers

Sistema de gestión local persistente para tostadores de café.

## 🚀 Lanzamiento Local

1. Instala [Node.js](https://nodejs.org/).
2. Abre una terminal en esta carpeta.
3. Instala dependencias:
   ```bash
   npm install
   ```
4. Inicia la aplicación:
   ```bash
   npm run dev
   ```
5. Abre `http://localhost:3000` en tu navegador.

## 💾 Persistencia de Datos

- **IndexedDB**: Esta aplicación utiliza una base de datos local en tu navegador. Los datos **no se borran** al cerrar la pestaña o reiniciar la computadora.
- **Backups**: Aunque los datos son persistentes, se recomienda usar el botón **"Exportar Backup"** en el Dashboard una vez al día para descargar una copia de seguridad en formato `.json`.
- **Seguridad**: Los datos nunca salen de tu computadora; todo el procesamiento es local.
