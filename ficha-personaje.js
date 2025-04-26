document.addEventListener("DOMContentLoaded", () => {
  console.log("ficha-personaje.js: DOM cargado")

  // Obtener el nombre del personaje de la URL
  const urlParams = new URLSearchParams(window.location.search)
  const characterName = urlParams.get("nombre")

  if (!characterName) {
    alert("No se ha especificado un personaje.")
    window.location.href = "personaje.html"
    return
  }

  // Cargar datos del personaje
  const characterData = localStorage.getItem(characterName + ".json")
  if (!characterData) {
    alert("No se encontró el personaje especificado.")
    window.location.href = "personaje.html"
    return
  }

  const personaje = JSON.parse(characterData)
  console.log("Personaje cargado:", personaje)

  // Inicializar estructura de datos si no existe
  if (!personaje.grimorio) {
    personaje.grimorio = []
  }

  if (!personaje.inventario) {
    personaje.inventario = {
      armaduras: [],
      armas: [],
      municion: [],
      pociones: [],
      pergaminos: [],
      monedas: 0,
      ganzuas: 0,
      antorchas: 0,
      cuerdas: 0,
      otros: [],
    }
  }

  // Asegurar que existen todas las categorías de inventario
  const categorias = ["armaduras", "armas", "municion", "pociones", "pergaminos", "otros"]
  categorias.forEach((categoria) => {
    if (!personaje.inventario[categoria]) {
      personaje.inventario[categoria] = []
    }
  })

  // Asegurar que existen los contadores simples
  const contadoresSimples = ["monedas", "ganzuas", "antorchas", "cuerdas"]
  contadoresSimples.forEach((contador) => {
    if (personaje.inventario[contador] === undefined) {
      personaje.inventario[contador] = 0
    }
  })

  // Actualizar título de la página
  const characterNameElement = document.getElementById("characterName")
  if (characterNameElement) {
    characterNameElement.textContent = `Ficha de ${personaje.nombre}`
  }

  // Rellenar campos del formulario con verificación de existencia
  const fillField = (id, value) => {
    const element = document.getElementById(id)
    if (element) {
      element.value = value
    } else {
      console.error(`Elemento con ID ${id} no encontrado`)
    }
  }

  fillField("nombre", personaje.nombre)
  fillField("raza", personaje.raza)
  fillField("nivel", personaje.nivel)
  fillField("clase", personaje.clase)
  fillField("combateCuerpo", personaje.combateCuerpo)
  fillField("combateDistancia", personaje.combateDistancia)
  fillField("lanzamientoHechizos", personaje.lanzamientoHechizos)
  fillField("vida", personaje.vida)
  fillField("aguante", personaje.aguante)
  fillField("mana", personaje.mana)

  // Cargar grimorio
  loadGrimorio()

  // Crear el elemento itemForm si no existe
  const inventoryList = document.getElementById("inventoryList")
  let itemForm = document.getElementById("itemForm")

  if (inventoryList && !itemForm) {
    console.log("Creando elemento itemForm que no existe")
    itemForm = document.createElement("div")
    itemForm.id = "itemForm"

    // Insertar después de inventoryList
    if (inventoryList.parentNode) {
      inventoryList.parentNode.insertBefore(itemForm, inventoryList.nextSibling)
    }
  }

  // Cargar inventario inicial (primera pestaña)
  loadInventory("armaduras")

  // Cargar equipamiento
  loadEquipment()

  // Configurar tabs de inventario
  setupInventoryTabs()

  // Botón para volver a la pantalla de personajes
  const backBtn = document.getElementById("backBtn")
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      // Redirigir directamente a personaje.html sin verificaciones
      window.location.href = "personaje.html"
    })
  }

  // Manejar cambios en los atributos y estado
  setupAttributeListeners()

  // Configurar botones de incremento/decremento para vida, aguante y maná
  setupStatusControls()

  // Configurar botón para abrir el modal de crear hechizo
  const createSpellBtn = document.getElementById("createSpellBtn")
  const createSpellModal = document.getElementById("createSpellModal")
  const closeCreateSpellModal = document.getElementById("closeCreateSpellModal")

  if (createSpellBtn && createSpellModal) {
    createSpellBtn.addEventListener("click", () => {
      // Limpiar campos del formulario
      if (document.getElementById("spellName")) document.getElementById("spellName").value = ""
      if (document.getElementById("spellAction")) document.getElementById("spellAction").value = ""
      if (document.getElementById("spellDescription")) document.getElementById("spellDescription").value = ""

      // Mostrar el modal
      createSpellModal.classList.add("show-modal")
    })
  }

  if (closeCreateSpellModal) {
    closeCreateSpellModal.addEventListener("click", () => {
      createSpellModal.classList.remove("show-modal")
    })

    // Cerrar el modal al hacer clic fuera de él
    window.addEventListener("click", (event) => {
      if (event.target === createSpellModal) {
        createSpellModal.classList.remove("show-modal")
      }
    })
  }

  // Configurar botón para agregar hechizo
  const addSpellBtn = document.getElementById("addSpellBtn")
  if (addSpellBtn) {
    addSpellBtn.addEventListener("click", () => {
      const spellName = document.getElementById("spellName")?.value.trim() || ""
      const difficultyValue = document.getElementById("spellDifficultyValue")?.value || "6"
      const difficultyDice = document.getElementById("spellDifficultyDice")?.value || "1d10"
      const distance = document.getElementById("spellDistance")?.value || "0"
      const use = document.getElementById("spellUse")?.value || "Ofensivo"
      const action = document.getElementById("spellAction")?.value || ""
      const description = document.getElementById("spellDescription")?.value || ""

      if (spellName) {
        addSpell({
          nombre: spellName,
          dificultad: {
            valor: difficultyValue,
            dados: difficultyDice,
          },
          distancia: distance,
          uso: use,
          accion: action,
          descripcion: description,
        })

        // Limpiar campos
        if (document.getElementById("spellName")) document.getElementById("spellName").value = ""
        if (document.getElementById("spellAction")) document.getElementById("spellAction").value = ""
        if (document.getElementById("spellDescription")) document.getElementById("spellDescription").value = ""

        // Cerrar el modal
        createSpellModal.classList.remove("show-modal")
      } else {
        alert("El nombre del hechizo es obligatorio")
      }
    })
  }

  // Función para cargar el grimorio
  function loadGrimorio() {
    const grimorioList = document.getElementById("grimorioList")
    if (!grimorioList) {
      console.error("No se encontró el elemento grimorioList")
      return
    }

    grimorioList.innerHTML = ""

    if (!personaje.grimorio || personaje.grimorio.length === 0) {
      const emptyRow = document.createElement("tr")
      emptyRow.innerHTML = `<td colspan="7" class="text-center">No hay hechizos en el grimorio.</td>`
      grimorioList.appendChild(emptyRow)
      return
    }

    personaje.grimorio.forEach((hechizo, index) => {
      // Compatibilidad con formato antiguo
      if (typeof hechizo === "string") {
        hechizo = {
          nombre: hechizo,
          dificultad: { valor: "6", dados: "1d10" },
          distancia: "0",
          uso: "Ofensivo",
          accion: "",
          descripcion: "",
        }
      }

      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${hechizo.nombre}</td>
        <td>${hechizo.dificultad.valor} → ${hechizo.dificultad.dados}</td>
        <td>${hechizo.distancia} m</td>
        <td>${hechizo.uso}</td>
        <td>${hechizo.accion}</td>
        <td>${hechizo.descripcion}</td>
        <td>
          <button class="btn-small edit-spell" data-index="${index}">Editar</button>
          <button class="btn-small remove-spell" data-index="${index}">Eliminar</button>
        </td>
      `
      grimorioList.appendChild(row)
    })

    // Agregar event listeners a los botones
    const removeButtons = grimorioList.querySelectorAll(".remove-spell")
    if (removeButtons) {
      removeButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const index = Number.parseInt(this.dataset.index)
          removeSpell(index)
        })
      })
    }

    const editButtons = grimorioList.querySelectorAll(".edit-spell")
    if (editButtons) {
      editButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const index = Number.parseInt(this.dataset.index)
          editSpell(index)
        })
      })
    }
  }

  // Función para editar un hechizo
  function editSpell(index) {
    const hechizo = personaje.grimorio[index]
    const modal = document.getElementById("createSpellModal")

    if (!modal) {
      console.error("No se encontró el modal para editar hechizos")
      return
    }

    // Rellenar el formulario con los datos del hechizo
    document.getElementById("spellName").value = hechizo.nombre
    document.getElementById("spellDifficultyValue").value = hechizo.dificultad.valor
    document.getElementById("spellDifficultyDice").value = hechizo.dificultad.dados
    document.getElementById("spellDistance").value = hechizo.distancia
    document.getElementById("spellUse").value = hechizo.uso
    document.getElementById("spellAction").value = hechizo.accion
    document.getElementById("spellDescription").value = hechizo.descripcion

    // Cambiar el botón de agregar por uno de actualizar
    const addSpellBtn = document.getElementById("addSpellBtn")
    addSpellBtn.textContent = "Actualizar Hechizo"
    addSpellBtn.dataset.editing = "true"
    addSpellBtn.dataset.index = index

    // Mostrar el modal
    modal.classList.add("show-modal")

    // Cambiar el event listener del botón
    addSpellBtn.removeEventListener("click", addSpellBtn.clickHandler)
    addSpellBtn.clickHandler = () => {
      const spellName = document.getElementById("spellName").value.trim()
      const difficultyValue = document.getElementById("spellDifficultyValue").value
      const difficultyDice = document.getElementById("spellDifficultyDice").value
      const distance = document.getElementById("spellDistance").value
      const use = document.getElementById("spellUse").value
      const action = document.getElementById("spellAction").value
      const description = document.getElementById("spellDescription").value

      if (spellName) {
        // Actualizar el hechizo
        personaje.grimorio[index] = {
          nombre: spellName,
          dificultad: {
            valor: difficultyValue,
            dados: difficultyDice,
          },
          distancia: distance,
          uso: use,
          accion: action,
          descripcion: description,
        }

        saveCharacter()
        loadGrimorio()

        // Limpiar campos y restaurar botón
        document.getElementById("spellName").value = ""
        document.getElementById("spellAction").value = ""
        document.getElementById("spellDescription").value = ""
        addSpellBtn.textContent = "Agregar Hechizo"
        delete addSpellBtn.dataset.editing
        delete addSpellBtn.dataset.index

        // Cerrar el modal
        modal.classList.remove("show-modal")

        // Restaurar el event listener original
        addSpellBtn.removeEventListener("click", addSpellBtn.clickHandler)
        addSpellBtn.addEventListener("click", () => {
          const spellName = document.getElementById("spellName").value.trim()
          const difficultyValue = document.getElementById("spellDifficultyValue").value
          const difficultyDice = document.getElementById("spellDifficultyDice").value
          const distance = document.getElementById("spellDistance").value
          const use = document.getElementById("spellUse").value
          const action = document.getElementById("spellAction").value
          const description = document.getElementById("spellDescription").value

          if (spellName) {
            addSpell({
              nombre: spellName,
              dificultad: {
                valor: difficultyValue,
                dados: difficultyDice,
              },
              distancia: distance,
              uso: use,
              accion: action,
              descripcion: description,
            })

            // Limpiar campos
            document.getElementById("spellName").value = ""
            document.getElementById("spellAction").value = ""
            document.getElementById("spellDescription").value = ""

            // Cerrar el modal
            modal.classList.remove("show-modal")
          } else {
            alert("El nombre del hechizo es obligatorio")
          }
        })
      } else {
        alert("El nombre del hechizo es obligatorio")
      }
    }
    addSpellBtn.addEventListener("click", addSpellBtn.clickHandler)
  }

  // Función para agregar un hechizo al grimorio
  function addSpell(hechizo) {
    if (!personaje.grimorio) {
      personaje.grimorio = []
    }
    personaje.grimorio.push(hechizo)
    saveCharacter()
    loadGrimorio()
  }

  // Función para eliminar un hechizo del grimorio
  function removeSpell(index) {
    personaje.grimorio.splice(index, 1)
    saveCharacter()
    loadGrimorio()
  }

  // Función para cargar el inventario según la categoría
  function loadInventory(category) {
    const inventoryList = document.getElementById("inventoryList")
    let itemForm = document.getElementById("itemForm")

    // Si itemForm no existe, crearlo
    if (!itemForm && inventoryList) {
      console.log("Creando elemento itemForm dinámicamente")
      itemForm = document.createElement("div")
      itemForm.id = "itemForm"

      // Insertar después de inventoryList
      if (inventoryList.parentNode) {
        inventoryList.parentNode.insertBefore(itemForm, inventoryList.nextSibling)
      }
    }

    if (!inventoryList || !itemForm) {
      console.error(
        "No se encontraron los elementos de inventario. inventoryList:",
        inventoryList,
        "itemForm:",
        itemForm,
      )
      return
    }

    inventoryList.innerHTML = ""
    itemForm.innerHTML = ""

    // Cargar el formulario específico para la categoría
    loadItemForm(category, itemForm)

    // Categorías con contadores simples
    const contadoresSimples = ["monedas", "ganzuas", "antorchas", "cuerdas"]

    if (contadoresSimples.includes(category)) {
      // Mostrar contador simple
      const cantidad = personaje.inventario[category] || 0

      inventoryList.innerHTML = `
        <div class="simple-item">
          <span>Cantidad de ${category}:</span>
          <div class="simple-item-value">${cantidad}</div>
          <div class="simple-item-controls">
            <button class="btn-small decrease-simple" data-category="${category}">-</button>
            <button class="btn-small increase-simple" data-category="${category}">+</button>
          </div>
        </div>
      `

      // Agregar event listeners a los botones
      const decreaseBtn = inventoryList.querySelector(".decrease-simple")
      const increaseBtn = inventoryList.querySelector(".increase-simple")

      if (decreaseBtn && increaseBtn) {
        decreaseBtn.addEventListener("click", () => {
          if (personaje.inventario[category] > 0) {
            personaje.inventario[category]--
            saveCharacter()
            loadInventory(category)
          }
        })

        increaseBtn.addEventListener("click", () => {
          personaje.inventario[category]++
          saveCharacter()
          loadInventory(category)
        })
      }

      return
    }

    // Para categorías con objetos complejos
    if (!personaje.inventario[category] || personaje.inventario[category].length === 0) {
      inventoryList.innerHTML = "<p>No hay objetos en esta categoría.</p>"
      return
    }

    // Crear tabla según la categoría
    let tableHTML = `<table class="inventory-table"><thead><tr>`

    // Definir columnas según la categoría
    let columns = []

    switch (category) {
      case "armaduras":
        columns = [
          "Cantidad",
          "Nombre",
          "Resistencia Máx",
          "Bloqueo Físico",
          "Bloqueo Mágico",
          "Resistencia Actual",
          "Acciones",
        ]
        break
      case "armas":
        columns = [
          "Cantidad",
          "Nombre",
          "Manos",
          "Tipo",
          "Daño",
          "Resistencia Máx",
          "Resistencia Actual",
          "Estadísticas",
          "Acciones",
        ]
        break
      case "municion":
        columns = ["Cantidad", "Nombre", "Mejora", "Acciones"]
        break
      case "pociones":
        columns = ["Cantidad", "Nombre", "Modificador", "Efecto", "Acciones"]
        break
      case "pergaminos":
        columns = ["Cantidad", "Nombre", "Tipo", "Modificador", "Efecto", "Descripción", "Acciones"]
        break
      case "otros":
        columns = ["Cantidad", "Nombre", "Descripción", "Acciones"]
        break
      default:
        columns = ["Cantidad", "Nombre", "Acciones"]
    }

    // Crear encabezados de tabla
    columns.forEach((column) => {
      tableHTML += `<th>${column}</th>`
    })

    tableHTML += `</tr></thead><tbody>`

    // Agregar filas según los items
    personaje.inventario[category].forEach((item, index) => {
      tableHTML += `<tr>`

      switch (category) {
        case "armaduras":
          tableHTML += `
            <td class="quantity-cell">${item.cantidad}</td>
            <td>${item.nombre}</td>
            <td>${item.resistenciaMax}</td>
            <td>${item.bloqueoFisico}</td>
            <td>${item.bloqueoMagico}</td>
            <td>${item.resistenciaActual}</td>
            <td class="actions-cell">
              <button class="btn-small edit-item" data-category="${category}" data-index="${index}">Editar</button>
              <button class="btn-small equip-item" data-category="${category}" data-index="${index}">Equipar</button>
              <button class="btn-small remove-item" data-category="${category}" data-index="${index}">Eliminar</button>
            </td>
          `
          break
        case "armas":
          // Asegurar que las armas tienen propiedades de resistencia
          if (item.resistenciaMax === undefined) item.resistenciaMax = 10
          if (item.resistenciaActual === undefined) item.resistenciaActual = 10

          tableHTML += `
            <td class="quantity-cell">${item.cantidad}</td>
            <td>${item.nombre}</td>
            <td>${item.manos} mano(s)</td>
            <td>${item.tipo}</td>
            <td>${item.danio}</td>
            <td>${item.resistenciaMax || 10}</td>
            <td>${item.resistenciaActual || 10}</td>
            <td>${item.estadisticas || "-"}</td>
            <td class="actions-cell">
              <button class="btn-small edit-item" data-category="${category}" data-index="${index}">Editar</button>
              <button class="btn-small equip-item" data-category="${category}" data-index="${index}">Equipar</button>
              <button class="btn-small remove-item" data-category="${category}" data-index="${index}">Eliminar</button>
            </td>
          `
          break
        case "municion":
          tableHTML += `
            <td class="quantity-cell">${item.cantidad}</td>
            <td>${item.nombre}</td>
            <td>${item.mejora || "-"}</td>
            <td class="actions-cell">
              <button class="btn-small edit-item" data-category="${category}" data-index="${index}">Editar</button>
              <button class="btn-small remove-item" data-category="${category}" data-index="${index}">Eliminar</button>
            </td>
          `
          break
        case "pociones":
          tableHTML += `
            <td class="quantity-cell">${item.cantidad}</td>
            <td>${item.nombre}</td>
            <td>${item.modificador}</td>
            <td>${item.efecto}</td>
            <td class="actions-cell">
              <button class="btn-small edit-item" data-category="${category}" data-index="${index}">Editar</button>
              <button class="btn-small remove-item" data-category="${category}" data-index="${index}">Eliminar</button>
            </td>
          `
          break
        case "pergaminos":
          tableHTML += `
            <td class="quantity-cell">${item.cantidad}</td>
            <td>${item.nombre}</td>
            <td>${item.tipo}</td>
            <td>${item.modificador}</td>
            <td>${item.efecto}</td>
            <td>${item.descripcion || "-"}</td>
            <td class="actions-cell">
              <button class="btn-small edit-item" data-category="${category}" data-index="${index}">Editar</button>
              <button class="btn-small remove-item" data-category="${category}" data-index="${index}">Eliminar</button>
            </td>
          `
          break
        case "otros":
          tableHTML += `
            <td class="quantity-cell">${item.cantidad}</td>
            <td>${item.nombre}</td>
            <td>${item.descripcion || "-"}</td>
            <td class="actions-cell">
              <button class="btn-small edit-item" data-category="${category}" data-index="${index}">Editar</button>
              <button class="btn-small remove-item" data-category="${category}" data-index="${index}">Eliminar</button>
            </td>
          `
          break
        default:
          tableHTML += `
            <td class="quantity-cell">${item.cantidad}</td>
            <td>${item.nombre}</td>
            <td class="actions-cell">
              <button class="btn-small edit-item" data-category="${category}" data-index="${index}">Editar</button>
              <button class="btn-small remove-item" data-category="${category}" data-index="${index}">Eliminar</button>
            </td>
          `
      }

      tableHTML += `</tr>`
    })

    tableHTML += `</tbody></table>`

    inventoryList.innerHTML = tableHTML

    // Agregar event listeners a los botones
    const removeButtons = inventoryList.querySelectorAll(".remove-item")
    if (removeButtons) {
      removeButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const category = this.dataset.category
          const index = Number.parseInt(this.dataset.index)
          removeInventoryItem(category, index)
        })
      })
    }

    const equipButtons = inventoryList.querySelectorAll(".equip-item")
    if (equipButtons) {
      equipButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const category = this.dataset.category
          const index = Number.parseInt(this.dataset.index)
          equipItem(category, index)
        })
      })
    }

    const editButtons = inventoryList.querySelectorAll(".edit-item")
    if (editButtons) {
      editButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const category = this.dataset.category
          const index = Number.parseInt(this.dataset.index)
          editInventoryItem(category, index)
        })
      })
    }
  }

  // Función para editar un item del inventario
  function editInventoryItem(category, index) {
    const item = personaje.inventario[category][index]

    // Mostrar un formulario de edición según la categoría
    let formHTML = ""

    switch (category) {
      case "armaduras":
        formHTML = `
          <h3>Editar Armadura</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="editItemName">Nombre:</label>
              <input type="text" id="editItemName" value="${item.nombre}" required>
            </div>
            <div class="form-group">
              <label for="editItemQuantity">Cantidad:</label>
              <input type="number" id="editItemQuantity" min="1" value="${item.cantidad}">
            </div>
            <div class="form-group">
              <label for="editItemResistenciaMax">Resistencia Máxima:</label>
              <input type="number" id="editItemResistenciaMax" min="0" value="${item.resistenciaMax}">
            </div>
            <div class="form-group">
              <label for="editItemBloqueoFisico">Bloqueo Físico:</label>
              <input type="number" id="editItemBloqueoFisico" min="0" value="${item.bloqueoFisico}">
            </div>
            <div class="form-group">
              <label for="editItemBloqueoMagico">Bloqueo Mágico:</label>
              <input type="number" id="editItemBloqueoMagico" min="0" value="${item.bloqueoMagico}">
            </div>
            <div class="form-group">
              <label for="editItemResistenciaActual">Resistencia Actual:</label>
              <input type="number" id="editItemResistenciaActual" min="0" max="${item.resistenciaMax}" value="${item.resistenciaActual}">
            </div>
          </div>
          <div class="form-actions">
            <button id="saveEditBtn" class="btn" data-category="${category}" data-index="${index}">Guardar Cambios</button>
            <button id="cancelEditBtn" class="btn">Cancelar</button>
          </div>
        `
        break
      case "armas":
        // Asegurar que las armas tienen propiedades de resistencia
        if (item.resistenciaMax === undefined) item.resistenciaMax = 10
        if (item.resistenciaActual === undefined) item.resistenciaActual = 10

        formHTML = `
          <h3>Editar Arma</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="editItemName">Nombre:</label>
              <input type="text" id="editItemName" value="${item.nombre}" required>
            </div>
            <div class="form-group">
              <label for="editItemQuantity">Cantidad:</label>
              <input type="number" id="editItemQuantity" min="1" value="${item.cantidad}">
            </div>
            <div class="form-group">
              <label for="editItemManos">Manos necesarias:</label>
              <select id="editItemManos">
                <option value="0" ${item.manos == 0 ? "selected" : ""}>No requiere manos</option>
                <option value="1" ${item.manos == 1 ? "selected" : ""}>1 mano</option>
                <option value="2" ${item.manos == 2 ? "selected" : ""}>2 manos</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editItemTipo">Tipo de arma:</label>
              <select id="editItemTipo">
                <option value="Cuerpo a cuerpo" ${item.tipo === "Cuerpo a cuerpo" ? "selected" : ""}>Cuerpo a cuerpo</option>
                <option value="A distancia" ${item.tipo === "A distancia" ? "selected" : ""}>A distancia</option>
                <option value="Mágica" ${item.tipo === "Mágica" ? "selected" : ""}>Mágica</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editItemDanio">Daño (ej: 2d4+1):</label>
              <input type="text" id="editItemDanio" placeholder="1d6" value="${item.danio}">
            </div>
            <div class="form-group">
              <label for="editItemResistenciaMax">Resistencia Máxima:</label>
              <input type="number" id="editItemResistenciaMax" min="0" value="${item.resistenciaMax || 10}">
            </div>
            <div class="form-group">
              <label for="editItemResistenciaActual">Resistencia Actual:</label>
              <input type="number" id="editItemResistenciaActual" min="0" max="${item.resistenciaMax || 10}" value="${item.resistenciaActual || 10}">
            </div>
            <div class="form-group">
              <label for="editItemEstadisticas">Estadísticas modificadas:</label>
              <input type="text" id="editItemEstadisticas" placeholder="+1 daño, -1 defensa" value="${item.estadisticas || ""}">
            </div>
          </div>
          <div class="form-actions">
            <button id="saveEditBtn" class="btn" data-category="${category}" data-index="${index}">Guardar Cambios</button>
            <button id="cancelEditBtn" class="btn">Cancelar</button>
          </div>
        `
        break
      case "municion":
        formHTML = `
          <h3>Editar Munición</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="editItemName">Nombre:</label>
              <input type="text" id="editItemName" value="${item.nombre}" required>
            </div>
            <div class="form-group">
              <label for="editItemQuantity">Cantidad:</label>
              <input type="number" id="editItemQuantity" min="1" value="${item.cantidad}">
            </div>
            <div class="form-group">
              <label for="editItemMejora">Mejora:</label>
              <input type="text" id="editItemMejora" placeholder="daño +1" value="${item.mejora || ""}">
            </div>
          </div>
          <div class="form-actions">
            <button id="saveEditBtn" class="btn" data-category="${category}" data-index="${index}">Guardar Cambios</button>
            <button id="cancelEditBtn" class="btn">Cancelar</button>
          </div>
        `
        break
      case "pociones":
        formHTML = `
          <h3>Editar Poción</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="editItemName">Nombre:</label>
              <input type="text" id="editItemName" value="${item.nombre}" required>
            </div>
            <div class="form-group">
              <label for="editItemQuantity">Cantidad:</label>
              <input type="number" id="editItemQuantity" min="1" value="${item.cantidad}">
            </div>
            <div class="form-group">
              <label for="editItemModificador">Modificador:</label>
              <input type="text" id="editItemModificador" placeholder="salud" value="${item.modificador || ""}">
            </div>
            <div class="form-group">
              <label for="editItemEfecto">Efecto:</label>
              <input type="text" id="editItemEfecto" placeholder="+1" value="${item.efecto || ""}">
            </div>
          </div>
          <div class="form-actions">
            <button id="saveEditBtn" class="btn" data-category="${category}" data-index="${index}">Guardar Cambios</button>
            <button id="cancelEditBtn" class="btn">Cancelar</button>
          </div>
        `
        break
      case "pergaminos":
        formHTML = `
          <h3>Editar Pergamino</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="editItemName">Nombre:</label>
              <input type="text" id="editItemName" value="${item.nombre}" required>
            </div>
            <div class="form-group">
              <label for="editItemQuantity">Cantidad:</label>
              <input type="number" id="editItemQuantity" min="1" value="${item.cantidad}">
            </div>
            <div class="form-group">
              <label for="editItemTipo">Tipo:</label>
              <select id="editItemTipo">
                <option value="Ofensivo" ${item.tipo === "Ofensivo" ? "selected" : ""}>Ofensivo</option>
                <option value="Efecto de estado" ${item.tipo === "Efecto de estado" ? "selected" : ""}>Efecto de estado</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editItemModificador">Modificador:</label>
              <input type="text" id="editItemModificador" placeholder="daño" value="${item.modificador || ""}">
            </div>
            <div class="form-group">
              <label for="editItemEfecto">Efecto:</label>
              <input type="text" id="editItemEfecto" placeholder="+2" value="${item.efecto || ""}">
            </div>
            <div class="form-group full-width">
              <label for="editItemDescripcion">Descripción:</label>
              <textarea id="editItemDescripcion" rows="2">${item.descripcion || ""}</textarea>
            </div>
          </div>
          <div class="form-actions">
            <button id="saveEditBtn" class="btn" data-category="${category}" data-index="${index}">Guardar Cambios</button>
            <button id="cancelEditBtn" class="btn">Cancelar</button>
          </div>
        `
        break
      case "otros":
        formHTML = `
          <h3>Editar Otro Objeto</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="editItemName">Nombre:</label>
              <input type="text" id="editItemName" value="${item.nombre}" required>
            </div>
            <div class="form-group">
              <label for="editItemQuantity">Cantidad:</label>
              <input type="number" id="editItemQuantity" min="1" value="${item.cantidad}">
            </div>
            <div class="form-group full-width">
              <label for="editItemDescripcion">Descripción:</label>
              <textarea id="editItemDescripcion" rows="2">${item.descripcion || ""}</textarea>
            </div>
          </div>
          <div class="form-actions">
            <button id="saveEditBtn" class="btn" data-category="${category}" data-index="${index}">Guardar Cambios</button>
            <button id="cancelEditBtn" class="btn">Cancelar</button>
          </div>
        `
        break
    }

    // Mostrar el formulario de edición
    const itemForm = document.getElementById("itemForm")
    if (itemForm) {
      itemForm.innerHTML = formHTML

      // Agregar event listeners a los botones
      const saveEditBtn = itemForm.querySelector("#saveEditBtn")
      const cancelEditBtn = itemForm.querySelector("#cancelEditBtn")

      if (saveEditBtn) {
        saveEditBtn.addEventListener("click", function () {
          const category = this.dataset.category
          const index = Number.parseInt(this.dataset.index)

          // Obtener los valores del formulario
          const name = document.getElementById("editItemName").value.trim()
          const quantity = Number.parseInt(document.getElementById("editItemQuantity").value) || 1

          if (!name) {
            alert("El nombre del objeto es obligatorio")
            return
          }

          // Actualizar el item según la categoría
          switch (category) {
            case "armaduras":
              const resistenciaMax = Number.parseInt(document.getElementById("editItemResistenciaMax").value) || 10
              let resistenciaActual = Number.parseInt(document.getElementById("editItemResistenciaActual").value) || 10

              // Asegurar que la resistencia actual no sea mayor que la máxima
              if (resistenciaActual > resistenciaMax) {
                resistenciaActual = resistenciaMax
              }

              personaje.inventario[category][index] = {
                nombre: name,
                cantidad: quantity,
                resistenciaMax: resistenciaMax,
                bloqueoFisico: Number.parseInt(document.getElementById("editItemBloqueoFisico").value) || 0,
                bloqueoMagico: Number.parseInt(document.getElementById("editItemBloqueoMagico").value) || 0,
                resistenciaActual: resistenciaActual,
              }
              break
            case "armas":
              const armaResistenciaMax = Number.parseInt(document.getElementById("editItemResistenciaMax").value) || 10
              let armaResistenciaActual =
                Number.parseInt(document.getElementById("editItemResistenciaActual").value) || 10

              // Asegurar que la resistencia actual no sea mayor que la máxima
              if (armaResistenciaActual > armaResistenciaMax) {
                armaResistenciaActual = armaResistenciaMax
              }

              personaje.inventario[category][index] = {
                nombre: name,
                cantidad: quantity,
                manos: Number.parseInt(document.getElementById("editItemManos").value) || 1,
                tipo: document.getElementById("editItemTipo").value,
                danio: document.getElementById("editItemDanio").value || "1d6",
                resistenciaMax: armaResistenciaMax,
                resistenciaActual: armaResistenciaActual,
                estadisticas: document.getElementById("editItemEstadisticas").value || "",
              }
              break
            case "municion":
              personaje.inventario[category][index] = {
                nombre: name,
                cantidad: quantity,
                mejora: document.getElementById("editItemMejora").value || "",
              }
              break
            case "pociones":
              personaje.inventario[category][index] = {
                nombre: name,
                cantidad: quantity,
                modificador: document.getElementById("editItemModificador").value || "",
                efecto: document.getElementById("editItemEfecto").value || "",
              }
              break
            case "pergaminos":
              personaje.inventario[category][index] = {
                nombre: name,
                cantidad: quantity,
                tipo: document.getElementById("editItemTipo").value,
                modificador: document.getElementById("editItemModificador").value || "",
                efecto: document.getElementById("editItemEfecto").value || "",
                descripcion: document.getElementById("editItemDescripcion").value || "",
              }
              break
            case "otros":
              personaje.inventario[category][index] = {
                nombre: name,
                cantidad: quantity,
                descripcion: document.getElementById("editItemDescripcion").value || "",
              }
              break
          }

          saveCharacter()
          loadInventory(category)
        })
      }

      if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
          // Restaurar el formulario original
          const activeTab = document.querySelector(".tab-btn.active")
          if (activeTab) {
            loadItemForm(activeTab.dataset.category, itemForm)
          }
        })
      }
    }
  }

  // Función para cargar el formulario específico para cada categoría
  function loadItemForm(category, formContainer) {
    if (!formContainer) {
      console.error("No se encontró el contenedor del formulario")
      return
    }

    let formHTML = ""

    switch (category) {
      case "armaduras":
        formHTML = `
          <h3>Añadir Armadura</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="itemName">Nombre:</label>
              <input type="text" id="itemName" required>
            </div>
            <div class="form-group">
              <label for="itemQuantity">Cantidad:</label>
              <input type="number" id="itemQuantity" min="1" value="1">
            </div>
            <div class="form-group">
              <label for="itemResistenciaMax">Resistencia Máxima:</label>
              <input type="number" id="itemResistenciaMax" min="0" value="10">
            </div>
            <div class="form-group">
              <label for="itemBloqueoFisico">Bloqueo Físico:</label>
              <input type="number" id="itemBloqueoFisico" min="0" value="0">
            </div>
            <div class="form-group">
              <label for="itemBloqueoMagico">Bloqueo Mágico:</label>
              <input type="number" id="itemBloqueoMagico" min="0" value="0">
            </div>
            <div class="form-group">
              <label for="itemResistenciaActual">Resistencia Actual:</label>
              <input type="number" id="itemResistenciaActual" min="0" value="10">
            </div>
          </div>
          <button id="addItemBtn" class="btn" data-category="${category}">Agregar Armadura</button>
        `
        break
      case "armas":
        formHTML = `
          <h3>Añadir Arma</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="itemName">Nombre:</label>
              <input type="text" id="itemName" required>
            </div>
            <div class="form-group">
              <label for="itemQuantity">Cantidad:</label>
              <input type="number" id="itemQuantity" min="1" value="1">
            </div>
            <div class="form-group">
              <label for="itemManos">Manos necesarias:</label>
              <select id="itemManos">
                <option value="0">No requiere manos</option>
                <option value="1">1 mano</option>
                <option value="2">2 manos</option>
              </select>
            </div>
            <div class="form-group">
              <label for="itemTipo">Tipo de arma:</label>
              <select id="itemTipo">
                <option value="Cuerpo a cuerpo">Cuerpo a cuerpo</option>
                <option value="A distancia">A distancia</option>
                <option value="Mágica">Mágica</option>
              </select>
            </div>
            <div class="form-group">
              <label for="itemDanio">Daño (ej: 2d4+1):</label>
              <input type="text" id="itemDanio" placeholder="1d6">
            </div>
            <div class="form-group">
              <label for="itemResistenciaMax">Resistencia Máxima:</label>
              <input type="number" id="itemResistenciaMax" min="0" value="10">
            </div>
            <div class="form-group">
              <label for="itemResistenciaActual">Resistencia Actual:</label>
              <input type="number" id="itemResistenciaActual" min="0" value="10">
            </div>
            <div class="form-group">
              <label for="itemEstadisticas">Estadísticas modificadas:</label>
              <input type="text" id="itemEstadisticas" placeholder="+1 daño, -1 defensa">
            </div>
          </div>
          <button id="addItemBtn" class="btn" data-category="${category}">Agregar Arma</button>
        `
        break
      case "municion":
        formHTML = `
          <h3>Añadir Munición</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="itemName">Nombre:</label>
              <input type="text" id="itemName" required>
            </div>
            <div class="form-group">
              <label for="itemQuantity">Cantidad:</label>
              <input type="number" id="itemQuantity" min="1" value="10">
            </div>
            <div class="form-group">
              <label for="itemMejora">Mejora:</label>
              <input type="text" id="itemMejora" placeholder="daño +1">
            </div>
          </div>
          <button id="addItemBtn" class="btn" data-category="${category}">Agregar Munición</button>
        `
        break
      case "pociones":
        formHTML = `
          <h3>Añadir Poción</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="itemName">Nombre:</label>
              <input type="text" id="itemName" required>
            </div>
            <div class="form-group">
              <label for="itemQuantity">Cantidad:</label>
              <input type="number" id="itemQuantity" min="1" value="1">
            </div>
            <div class="form-group">
              <label for="itemModificador">Modificador:</label>
              <input type="text" id="itemModificador" placeholder="salud">
            </div>
            <div class="form-group">
              <label for="itemEfecto">Efecto:</label>
              <input type="text" id="itemEfecto" placeholder="+1">
            </div>
          </div>
          <button id="addItemBtn" class="btn" data-category="${category}">Agregar Poción</button>
        `
        break
      case "pergaminos":
        formHTML = `
          <h3>Añadir Pergamino</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="itemName">Nombre:</label>
              <input type="text" id="itemName" required>
            </div>
            <div class="form-group">
              <label for="itemQuantity">Cantidad:</label>
              <input type="number" id="itemQuantity" min="1" value="1">
            </div>
            <div class="form-group">
              <label for="itemTipo">Tipo:</label>
              <select id="itemTipo">
                <option value="Ofensivo">Ofensivo</option>
                <option value="Efecto de estado">Efecto de estado</option>
              </select>
            </div>
            <div class="form-group">
              <label for="itemModificador">Modificador:</label>
              <input type="text" id="itemModificador" placeholder="daño">
            </div>
            <div class="form-group">
              <label for="itemEfecto">Efecto:</label>
              <input type="text" id="itemEfecto" placeholder="+2">
            </div>
            <div class="form-group full-width">
              <label for="itemDescripcion">Descripción:</label>
              <textarea id="itemDescripcion" rows="2"></textarea>
            </div>
          </div>
          <button id="addItemBtn" class="btn" data-category="${category}">Agregar Pergamino</button>
        `
        break
      case "monedas":
      case "ganzuas":
      case "antorchas":
      case "cuerdas":
        formHTML = `
          <h3>Gestionar ${category}</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="itemQuantity">Cantidad a añadir:</label>
              <input type="number" id="itemQuantity" min="1" value="1">
            </div>
            <button id="addSimpleItemBtn" class="btn" data-category="${category}">Añadir</button>
          </div>
        `
        break
      case "otros":
        formHTML = `
          <h3>Añadir Otro Objeto</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="itemName">Nombre:</label>
              <input type="text" id="itemName" required>
            </div>
            <div class="form-group">
              <label for="itemQuantity">Cantidad:</label>
              <input type="number" id="itemQuantity" min="1" value="1">
            </div>
            <div class="form-group full-width">
              <label for="itemDescripcion">Descripción:</label>
              <textarea id="itemDescripcion" rows="2"></textarea>
            </div>
          </div>
          <button id="addItemBtn" class="btn" data-category="${category}">Agregar Objeto</button>
        `
        break
    }

    formContainer.innerHTML = formHTML

    // Agregar event listeners a los botones
    const addItemBtn = formContainer.querySelector("#addItemBtn")
    if (addItemBtn) {
      addItemBtn.addEventListener("click", function () {
        const category = this.dataset.category
        addInventoryItem(category)
      })
    }

    const addSimpleItemBtn = formContainer.querySelector("#addSimpleItemBtn")
    if (addSimpleItemBtn) {
      addSimpleItemBtn.addEventListener("click", function () {
        const category = this.dataset.category
        const quantity = Number.parseInt(document.getElementById("itemQuantity").value) || 1

        personaje.inventario[category] += quantity
        saveCharacter()
        loadInventory(category)
      })
    }
  }

  // Función para cargar los items equipados
  function loadEquipment() {
    const equippedItems = document.getElementById("equippedItems")

    if (!equippedItems) {
      console.error("No se encontró el elemento equippedItems")
      return
    }

    equippedItems.innerHTML = ""

    if (!personaje.equipados || personaje.equipados.length === 0) {
      equippedItems.innerHTML = "<p>No hay objetos equipados.</p>"
      return
    }

    let tableHTML = `
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Nombre</th>
            <th>Detalles</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `

    personaje.equipados.forEach((equippedItem, index) => {
      let detalles = ""

      if (equippedItem.categoria === "armas") {
        detalles = `${equippedItem.manos} mano(s), ${equippedItem.tipo}, Daño: ${equippedItem.danio}, Res: ${equippedItem.resistenciaActual || 10}/${equippedItem.resistenciaMax || 10}`
      } else if (equippedItem.categoria === "armaduras") {
        detalles = `BF: ${equippedItem.bloqueoFisico}, BM: ${equippedItem.bloqueoMagico}, Res: ${equippedItem.resistenciaActual}/${equippedItem.resistenciaMax}`
      }

      tableHTML += `
        <tr>
          <td>${equippedItem.categoria === "armas" ? "Arma" : "Armadura"}</td>
          <td>${equippedItem.nombre}</td>
          <td>${detalles}</td>
          <td>
            <button class="btn-small edit-equipped" data-index="${index}">Editar</button>
            <button class="btn-small unequip-item" data-index="${index}">Desequipar</button>
          </td>
        </tr>
      `
    })

    tableHTML += `</tbody></table>`

    equippedItems.innerHTML = tableHTML

    // Agregar event listeners a los botones
    const unequipButtons = equippedItems.querySelectorAll(".unequip-item")
    if (unequipButtons) {
      unequipButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const index = Number.parseInt(this.dataset.index)
          unequipItem(index)
        })
      })
    }

    const editEquippedButtons = equippedItems.querySelectorAll(".edit-equipped")
    if (editEquippedButtons) {
      editEquippedButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const index = Number.parseInt(this.dataset.index)
          editEquippedItem(index)
        })
      })
    }
  }

  // Función para editar un item equipado
  function editEquippedItem(index) {
    const item = personaje.equipados[index]
    const modal = document.getElementById("editEquippedModal")
    const modalContent = document.getElementById("editEquippedModalContent")

    if (!modal || !modalContent) {
      console.error("No se encontró el modal para editar items equipados")
      return
    }

    // Solo permitir editar la resistencia actual
    let formHTML = ""

    if (item.categoria === "armas") {
      // Asegurar que las armas tienen propiedades de resistencia
      if (item.resistenciaMax === undefined) item.resistenciaMax = 10
      if (item.resistenciaActual === undefined) item.resistenciaActual = 10

      formHTML = `
      <h3>Editar Resistencia del Arma: ${item.nombre}</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="editEquippedResistenciaActual">Resistencia Actual:</label>
          <input type="number" id="editEquippedResistenciaActual" min="0" max="${item.resistenciaMax || 10}" value="${item.resistenciaActual || 10}">
        </div>
      </div>
      <div class="form-actions">
        <button id="saveEquippedEditBtn" class="btn" data-index="${index}">Guardar Cambios</button>
      </div>
    `
    } else if (item.categoria === "armaduras") {
      formHTML = `
      <h3>Editar Resistencia de la Armadura: ${item.nombre}</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="editEquippedResistenciaActual">Resistencia Actual:</label>
          <input type="number" id="editEquippedResistenciaActual" min="0" max="${item.resistenciaMax}" value="${item.resistenciaActual}">
        </div>
      </div>
      <div class="form-actions">
        <button id="saveEquippedEditBtn" class="btn" data-index="${index}">Guardar Cambios</button>
      </div>
    `
    }

    // Mostrar el formulario de edición en el modal
    modalContent.innerHTML = formHTML
    modal.classList.add("show-modal")

    // Agregar event listeners a los botones
    const saveEquippedEditBtn = modalContent.querySelector("#saveEquippedEditBtn")
    const closeModalBtn = document.getElementById("closeEditEquippedModal")

    if (saveEquippedEditBtn) {
      saveEquippedEditBtn.addEventListener("click", function () {
        const index = Number.parseInt(this.dataset.index)

        // Obtener el valor de resistencia actual
        let resistenciaActual = Number.parseInt(document.getElementById("editEquippedResistenciaActual").value) || 0

        // Asegurar que la resistencia actual no sea mayor que la máxima
        if (resistenciaActual > personaje.equipados[index].resistenciaMax) {
          resistenciaActual = personaje.equipados[index].resistenciaMax
        }

        // Actualizar la resistencia actual
        personaje.equipados[index].resistenciaActual = resistenciaActual

        saveCharacter()
        loadEquipment()

        // Cerrar el modal
        modal.classList.remove("show-modal")
      })
    }

    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
        modal.classList.remove("show-modal")
      })
    }

    // Cerrar el modal al hacer clic fuera de él
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.classList.remove("show-modal")
      }
    })
  }

  // Función para agregar un item al inventario
  function addInventoryItem(category) {
    const itemName = document.getElementById("itemName")
    const itemQuantity = document.getElementById("itemQuantity")

    if (!itemName || !itemQuantity) {
      console.error("No se encontraron los elementos del formulario")
      return
    }

    const name = itemName.value.trim()
    const quantity = Number.parseInt(itemQuantity.value) || 1

    if (!name) {
      alert("El nombre del objeto es obligatorio")
      return
    }

    const newItem = {
      nombre: name,
      cantidad: quantity,
    }

    // Agregar propiedades específicas según la categoría
    switch (category) {
      case "armaduras":
        const armaduraResistenciaMax = Number.parseInt(document.getElementById("itemResistenciaMax").value) || 10
        let armaduraResistenciaActual = Number.parseInt(document.getElementById("itemResistenciaActual").value) || 10

        // Asegurar que la resistencia actual no sea mayor que la máxima
        if (armaduraResistenciaActual > armaduraResistenciaMax) {
          armaduraResistenciaActual = armaduraResistenciaMax
        }

        newItem.resistenciaMax = armaduraResistenciaMax
        newItem.bloqueoFisico = Number.parseInt(document.getElementById("itemBloqueoFisico").value) || 0
        newItem.bloqueoMagico = Number.parseInt(document.getElementById("itemBloqueoMagico").value) || 0
        newItem.resistenciaActual = armaduraResistenciaActual
        break
      case "armas":
        const armaResistenciaMax = Number.parseInt(document.getElementById("itemResistenciaMax").value) || 10
        let armaResistenciaActual = Number.parseInt(document.getElementById("itemResistenciaActual").value) || 10

        // Asegurar que la resistencia actual no sea mayor que la máxima
        if (armaResistenciaActual > armaResistenciaMax) {
          armaResistenciaActual = armaResistenciaMax
        }

        newItem.manos = Number.parseInt(document.getElementById("itemManos").value) || 1
        newItem.tipo = document.getElementById("itemTipo").value
        newItem.danio = document.getElementById("itemDanio").value || "1d6"
        newItem.resistenciaMax = armaResistenciaMax
        newItem.resistenciaActual = armaResistenciaActual
        newItem.estadisticas = document.getElementById("itemEstadisticas").value || ""
        break
      case "municion":
        newItem.mejora = document.getElementById("itemMejora").value || ""
        break
      case "pociones":
        newItem.modificador = document.getElementById("itemModificador").value || ""
        newItem.efecto = document.getElementById("itemEfecto").value || ""
        break
      case "pergaminos":
        newItem.tipo = document.getElementById("itemTipo").value
        newItem.modificador = document.getElementById("itemModificador").value || ""
        newItem.efecto = document.getElementById("itemEfecto").value || ""
        newItem.descripcion = document.getElementById("itemDescripcion").value || ""
        break
      case "otros":
        newItem.descripcion = document.getElementById("itemDescripcion").value || ""
        break
    }

    if (!personaje.inventario[category]) {
      personaje.inventario[category] = []
    }

    personaje.inventario[category].push(newItem)
    saveCharacter()
    loadInventory(category)

    // Limpiar campos
    itemName.value = ""
    if (document.getElementById("itemDescripcion")) {
      document.getElementById("itemDescripcion").value = ""
    }
  }

  // Función para eliminar un item del inventario
  function removeInventoryItem(category, index) {
    personaje.inventario[category].splice(index, 1)
    saveCharacter()
    loadInventory(category)
  }

  // Función para equipar un item
  function equipItem(category, index) {
    // Solo se pueden equipar armas y armaduras
    if (category !== "armas" && category !== "armaduras") {
      alert("Solo se pueden equipar armas y armaduras")
      return
    }

    const item = personaje.inventario[category][index]

    // Verificar si hay suficientes manos disponibles (solo para armas)
    if (category === "armas" && item.manos > 0) {
      const manosUsadas = personaje.equipados
        .filter((item) => item.categoria === "armas")
        .reduce((total, item) => total + item.manos, 0)

      const manosDisponibles = personaje.brazos * 2 // Cada brazo tiene 2 manos

      if (manosUsadas + item.manos > manosDisponibles) {
        alert(`No tienes suficientes manos disponibles. Tienes ${manosDisponibles - manosUsadas} mano(s) libre(s).`)
        return
      }
    }

    // Si es un item con cantidad, reducir la cantidad
    if (item.cantidad > 1) {
      item.cantidad--

      // Crear una copia del item para equipar
      const itemToEquip = { ...item, categoria: category, cantidad: 1 }

      personaje.equipados.push(itemToEquip)
    } else {
      // Si solo hay uno, moverlo a equipados
      const itemToEquip = { ...item, categoria: category }

      personaje.equipados.push(itemToEquip)
      personaje.inventario[category].splice(index, 1)
    }

    saveCharacter()
    loadInventory(category)
    loadEquipment()
  }

  // Función para desequipar un item
  function unequipItem(index) {
    const item = personaje.equipados[index]
    const category = item.categoria

    // Devolver el item al inventario
    if (!personaje.inventario[category]) {
      personaje.inventario[category] = []
    }

    // Crear una copia del item sin la propiedad categoria
    const { categoria, ...itemForInventory } = item

    // Buscar si ya existe un item similar en el inventario
    const existingItemIndex = personaje.inventario[category].findIndex(
      (i) =>
        i.nombre === item.nombre &&
        (category !== "armas" || i.manos === item.manos) &&
        (category !== "armaduras" ||
          (i.resistenciaMax === item.resistenciaMax &&
            i.bloqueoFisico === item.bloqueoFisico &&
            i.bloqueoMagico === item.bloqueoMagico)),
    )

    if (existingItemIndex !== -1) {
      // Si existe, incrementar la cantidad
      personaje.inventario[category][existingItemIndex].cantidad++
    } else {
      // Si no existe, agregar como nuevo item
      personaje.inventario[category].push({
        ...itemForInventory,
        cantidad: 1,
      })
    }

    // Eliminar de equipados
    personaje.equipados.splice(index, 1)

    saveCharacter()
    loadEquipment()

    // Recargar la categoría actual del inventario
    const activeTab = document.querySelector(".tab-btn.active")
    if (activeTab) {
      loadInventory(activeTab.dataset.category)
    }
  }

  // Configurar listeners para los cambios en atributos
  function setupAttributeListeners() {
    const attributeInputs = [
      "nivel",
      "clase",
      "combateCuerpo",
      "combateDistancia",
      "lanzamientoHechizos",
      "vida",
      "aguante",
      "mana",
    ]

    attributeInputs.forEach((attr) => {
      const element = document.getElementById(attr)
      if (element) {
        element.addEventListener("change", function () {
          personaje[attr] = this.type === "number" ? Number.parseInt(this.value) : this.value
          saveCharacter()
        })
      } else {
        console.error(`Elemento con ID ${attr} no encontrado`)
      }
    })
  }

  // Configurar controles de estado (vida, aguante, maná)
  function setupStatusControls() {
    const statusControls = ["vida", "aguante", "mana"]

    statusControls.forEach((status) => {
      const statusInput = document.getElementById(status)
      if (!statusInput) {
        console.error(`Elemento con ID ${status} no encontrado`)
        return
      }

      const statusContainer = statusInput.closest(".form-group")
      if (!statusContainer) {
        console.error(`Contenedor para ${status} no encontrado`)
        return
      }

      const decreaseBtn = statusContainer.querySelector(".decrease")
      const increaseBtn = statusContainer.querySelector(".increase")

      if (!decreaseBtn) {
        console.error(`Botón decrease para ${status} no encontrado`)
        return
      }

      if (!increaseBtn) {
        console.error(`Botón increase para ${status} no encontrado`)
        return
      }

      decreaseBtn.addEventListener("click", () => {
        if (Number.parseInt(statusInput.value) > 0) {
          statusInput.value = Number.parseInt(statusInput.value) - 1
          personaje[status] = Number.parseInt(statusInput.value)
          saveCharacter()
        }
      })

      increaseBtn.addEventListener("click", () => {
        statusInput.value = Number.parseInt(statusInput.value) + 1
        personaje[status] = Number.parseInt(statusInput.value)
        saveCharacter()
      })
    })
  }

  // Configurar tabs de inventario
  function setupInventoryTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn")
    if (!tabButtons || tabButtons.length === 0) {
      console.error("No se encontraron botones de tabs")
      return
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Desactivar todos los tabs
        tabButtons.forEach((btn) => btn.classList.remove("active"))

        // Activar el tab actual
        this.classList.add("active")

        // Cargar inventario de la categoría seleccionada
        const category = this.dataset.category
        loadInventory(category)
      })
    })
  }

  // Función para guardar los cambios del personaje
  function saveCharacter() {
    localStorage.setItem(personaje.nombre + ".json", JSON.stringify(personaje))
    console.log("Personaje guardado:", personaje)
  }
})
