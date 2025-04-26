document.addEventListener("DOMContentLoaded", () => {
  const importFileInput = document.getElementById("importFile")
  const importBtn = document.getElementById("importBtn")
  const exportBtn = document.getElementById("exportBtn")
  const continueBtn = document.getElementById("continueBtn")

  // Función para verificar si existe el archivo AppRol.json
  function checkAppRolFile() {
    if (localStorage.getItem("personajes")) {
      return true
    }
    return false
  }

  // Función para crear un nuevo archivo AppRol.json
  function createAppRolFile() {
    const defaultData = {
      personajes: [],
    }
    localStorage.setItem("personajes", JSON.stringify(defaultData))
  }

  // Función para importar archivo JSON
  importBtn.addEventListener("click", () => {
    const file = importFileInput.files[0]
    if (!file) {
      alert("Por favor, selecciona un archivo JSON para importar.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        localStorage.setItem("personajes", JSON.stringify(data))
        alert("Archivo importado correctamente.")
      } catch (error) {
        alert("Error al importar el archivo: " + error.message)
      }
    }
    reader.readAsText(file)
  })

  // Función para exportar personajes
  exportBtn.addEventListener("click", () => {
    if (!checkAppRolFile()) {
      alert("No hay datos para exportar.")
      return
    }

    const data = localStorage.getItem("personajes")
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "AppRol.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })

  // Función para continuar a la pantalla de selección de personajes
  continueBtn.addEventListener("click", () => {
    if (!checkAppRolFile()) {
      createAppRolFile()
    }
    window.location.href = "personaje.html"
  })
})
