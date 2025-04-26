// Funciones de utilidad para la aplicación

// Función para guardar datos en localStorage
function saveToLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// Función para obtener datos de localStorage
function getFromLocalStorage(key) {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

// Función para generar un ID único
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Función para validar que un nombre no esté duplicado
function isNameUnique(name, existingNames) {
  return !existingNames.includes(name)
}

// Función para exportar datos a un archivo JSON
function exportToJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Función para importar datos desde un archivo JSON
function importFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"))
    }

    reader.readAsText(file)
  })
}
