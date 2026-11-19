let todosLosProductos = [];

// ==========================================
// 1. NAVEGACIÓN ENTRE SECCIONES
// ==========================================
function cambiarVista(idSeccion) {
    // Ocultar todas las vistas
    document.querySelectorAll(".vista-pagina").forEach(sec => {
        sec.style.display = "none";
    });

    // Mostrar la vista elegida
    let destino = document.getElementById(idSeccion);
    if (destino) {
        destino.style.display = "block";
    }

    // Actualizar clase activa en el menú superior
    document.querySelectorAll("nav a.nav-link").forEach(link => {
        link.classList.remove("activo");
        if (link.getAttribute("data-seccion") === idSeccion) {
            link.classList.add("activo");
        }
    });

    if (idSeccion === "sec-carrito") {
        renderizarCarrito();
    }

    window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-link").forEach(elemento => {
    elemento.addEventListener("click", function(e) {
        e.preventDefault();
        let seccion = this.getAttribute("data-seccion");
        cambiarVista(seccion);
    });
});

// Acceso rápido desde las tarjetas de categorías del Inicio
document.querySelectorAll(".nav-cat").forEach(caja => {
    caja.addEventListener("click", function(e) {
        e.preventDefault();
        let cat = this.getAttribute("data-cat");
        let selectCat = document.getElementById("filtroCategoria");
        if (selectCat) {
            selectCat.value = cat;
            filtrarProductos();
        }
        cambiarVista("sec-productos");
    });
});

// ==========================================
// 2. CARGA DE DATOS DESDE productos.json
// ==========================================
fetch("data/productos.json")
    .then(respuesta => respuesta.json())
    .then(datos => {
        todosLosProductos = datos;

        // Inicializar Inicio, Catálogo y Dashboard con el mismo fetch
        cargarDestacados(todosLosProductos);
        cargarCategorias(todosLosProductos);
        mostrarProductos(todosLosProductos);
        generarDashboard(todosLosProductos);
    })
    .catch(error => console.log("Error al cargar productos.json:", error));

// ==========================================
// 3. PRODUCTOS DESTACADOS (INICIO)
// ==========================================
function cargarDestacados(productos) {
    let contenedorDestacados = document.getElementById("contenedorDestacados");
    if (!contenedorDestacados) return;

    contenedorDestacados.innerHTML = "";
    let destacados = productos.filter(p => p.destacado === true);

    destacados.forEach(prod => {
        let card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${prod.imagen}" alt="${prod.nombre}">
            <div class="card-body">
                <div>
                    <span class="categoria-tag">${prod.categoria}</span>
                    <h3>${prod.nombre}</h3>
                    <p class="precio">${prod.precio} Bs</p>
                </div>
                <button class="btn btn-ir-catalogo">Ver en Catálogo</button>
            </div>
        `;
        card.querySelector(".btn-ir-catalogo").addEventListener("click", () => {
            cambiarVista("sec-productos");
        });
        contenedorDestacados.appendChild(card);
    });
}

// ==========================================
// 4. CATÁLOGO, BÚSQUEDA, FILTROS Y MODAL
// ==========================================
let listaProductos = document.getElementById("listaProductos");
let buscador = document.getElementById("buscador");
let filtroCategoria = document.getElementById("filtroCategoria");
let filtroEstado = document.getElementById("filtroEstado");
let ordenPrecio = document.getElementById("ordenPrecio");

function cargarCategorias(productos) {
    let categorias = [...new Set(productos.map(p => p.categoria))];
    categorias.forEach(cat => {
        let opcion = document.createElement("option");
        opcion.value = cat;
        opcion.textContent = cat;
        filtroCategoria.appendChild(opcion);
    });
}

function mostrarProductos(lista) {
    listaProductos.innerHTML = "";

    if (lista.length === 0) {
        listaProductos.innerHTML = "<p>No se encontraron prendas con esos filtros.</p>";
        return;
    }

    lista.forEach(prod => {
        let textoStock = "";
        let claseStock = "";

        if (prod.stock === 0) {
            textoStock = "Agotado";
            claseStock = "stock-agotado";
        } else if (prod.stock <= 5) {
            textoStock = `¡Últimas ${prod.stock} unidades!`;
            claseStock = "stock-bajo";
        } else {
            textoStock = `Disponible (${prod.stock} en stock)`;
            claseStock = "stock-ok";
        }

        let card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${prod.imagen}" alt="${prod.nombre}">
            <div class="card-body">
                <div>
                    <span class="categoria-tag">${prod.categoria}</span>
                    <h3>${prod.nombre}</h3>
                    <p style="font-size:0.9rem; color:#555; margin-top:5px;">${prod.descripcion}</p>
                    <p class="precio">${prod.precio} Bs</p>
                    <p class="${claseStock}">${textoStock}</p>
                </div>
                <div class="card-acciones">
                    <button class="btn btn-secundario btn-detalle">Detalles</button>
                    <button class="btn btn-agregar" ${prod.stock === 0 ? "disabled" : ""}>+ Carrito</button>
                </div>
            </div>
        `;

        card.querySelector(".btn-detalle").addEventListener("click", () => abrirModal(prod));
        card.querySelector(".btn-agregar").addEventListener("click", () => agregarAlCarrito(prod));

        listaProductos.appendChild(card);
    });
}

function filtrarProductos() {
    let texto = buscador.value.toLowerCase();
    let cat = filtroCategoria.value;
    let estado = filtroEstado.value;
    let orden = ordenPrecio.value;

    let filtrados = todosLosProductos.filter(p => {
        let coincideNombre = p.nombre.toLowerCase().includes(texto);
        let coincideCat = (cat === "todas") || (p.categoria === cat);
        let coincideEstado = true;

        if (estado === "disponible") coincideEstado = p.stock > 0;
        if (estado === "agotado") coincideEstado = p.stock === 0;

        return coincideNombre && coincideCat && coincideEstado;
    });

    if (orden === "menor") {
        filtrados.sort((a, b) => a.precio - b.precio);
    } else if (orden === "mayor") {
        filtrados.sort((a, b) => b.precio - a.precio);
    }

    mostrarProductos(filtrados);
}

buscador.addEventListener("input", filtrarProductos);
filtroCategoria.addEventListener("change", filtrarProductos);
filtroEstado.addEventListener("change", filtrarProductos);
ordenPrecio.addEventListener("change", filtrarProductos);

// Modal Detalles
let modal = document.getElementById("modalDetalle");
document.getElementById("cerrarModal").addEventListener("click", () => {
    modal.style.display = "none";
});

function abrirModal(prod) {
    document.getElementById("modalImg").src = prod.imagen;
    document.getElementById("modalNombre").textContent = prod.nombre;
    document.getElementById("modalCategoria").textContent = prod.categoria;
    document.getElementById("modalDesc").textContent = prod.descripcion;
    document.getElementById("modalPrecio").textContent = prod.precio + " Bs";
    document.getElementById("modalStock").textContent = prod.stock > 0 ? `Stock disponible: ${prod.stock}` : "Producto agotado";

    let btnModal = document.getElementById("modalBtnAgregar");
    btnModal.disabled = prod.stock === 0;
    btnModal.onclick = () => {
        agregarAlCarrito(prod);
        modal.style.display = "none";
    };

    modal.style.display = "flex";
}

// ==========================================
// 5. CARRITO DE COMPRAS (localStorage)
// ==========================================
function obtenerCarrito() {
    return JSON.parse(localStorage.getItem("carritoJR")) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem("carritoJR", JSON.stringify(carrito));
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    let carrito = obtenerCarrito();
    let totalItems = carrito.reduce((suma, item) => suma + item.cantidad, 0);
    let badge = document.getElementById("contadorCarrito");
    if (badge) {
        badge.textContent = totalItems;
    }
}

function agregarAlCarrito(producto) {
    if (producto.stock <= 0) {
        alert("Este producto está agotado.");
        return;
    }

    let carrito = obtenerCarrito();
    let existente = carrito.find(item => item.id === producto.id);

    if (existente) {
        if (existente.cantidad < producto.stock) {
            existente.cantidad++;
        } else {
            alert("No hay más unidades disponibles en stock.");
            return;
        }
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    alert("Agregado al carrito: " + producto.nombre);
}

let tablaCarrito = document.getElementById("tablaCarrito");
let totalCarrito = document.getElementById("totalCarrito");
let mensajeCompra = document.getElementById("mensajeCompra");

function renderizarCarrito() {
    let carrito = obtenerCarrito();
    tablaCarrito.innerHTML = "";
    let totalGeneral = 0;

    if (carrito.length === 0) {
        tablaCarrito.innerHTML = '<tr><td colspan="5">El carrito está vacío.</td></tr>';
        totalCarrito.textContent = "0 Bs";
        return;
    }

    carrito.forEach((item, indice) => {
        let subtotal = item.precio * item.cantidad;
        totalGeneral += subtotal;

        let fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.precio} Bs</td>
            <td>${item.cantidad}</td>
            <td>${subtotal} Bs</td>
            <td><button class="btn btn-peligro btn-quitar" data-indice="${indice}">Quitar</button></td>
        `;
        tablaCarrito.appendChild(fila);
    });

    totalCarrito.textContent = totalGeneral + " Bs";

    document.querySelectorAll(".btn-quitar").forEach(btn => {
        btn.addEventListener("click", function() {
            let idx = this.getAttribute("data-indice");
            carrito.splice(idx, 1);
            guardarCarrito(carrito);
            renderizarCarrito();
        });
    });
}

document.getElementById("btnVaciar").addEventListener("click", function() {
    localStorage.removeItem("carritoJR");
    actualizarContadorCarrito();
    renderizarCarrito();
});

document.getElementById("btnFinalizar").addEventListener("click", function() {
    let carrito = obtenerCarrito();
    if (carrito.length === 0) {
        alert("Agrega productos antes de finalizar el pedido.");
        return;
    }
    localStorage.removeItem("carritoJR");
    actualizarContadorCarrito();
    renderizarCarrito();
    mensajeCompra.textContent = "¡Pedido registrado con éxito! Nos comunicaremos contigo para coordinar la entrega.";
});

// ==========================================
// 6. FORMULARIO DE CONTACTO
// ==========================================
let formContacto = document.getElementById("formContacto");
let respuestaContacto = document.getElementById("respuestaContacto");

formContacto.addEventListener("submit", function(e) {
    e.preventDefault();

    let nombre = document.getElementById("nombre").value.trim();
    let correo = document.getElementById("correo").value.trim();
    let celular = document.getElementById("celular").value.trim();
    let asunto = document.getElementById("asunto").value.trim();
    let mensaje = document.getElementById("mensaje").value.trim();

    if (!nombre || !correo || !celular || !asunto || !mensaje) {
        respuestaContacto.style.color = "#dc2626";
        respuestaContacto.textContent = "Por favor, complete todos los campos obligatorios.";
        return;
    }

    if (!correo.includes("@") || !correo.includes(".")) {
        respuestaContacto.style.color = "#dc2626";
        respuestaContacto.textContent = "Ingrese un correo electrónico válido.";
        return;
    }

    if (celular.length < 7 || isNaN(celular)) {
        respuestaContacto.style.color = "#dc2626";
        respuestaContacto.textContent = "Ingrese un número de celular válido (solo números).";
        return;
    }

    respuestaContacto.style.color = "#059669";
    respuestaContacto.textContent = `¡Gracias, ${nombre}! Tu mensaje sobre "${asunto}" ha sido enviado correctamente.`;
    formContacto.reset();
});

// ==========================================
// 7. DASHBOARD ESTADÍSTICO Y GRÁFICOS
// ==========================================
function generarDashboard(productos) {
    let ahora = new Date();
    document.getElementById("fechaActualizacion").textContent =
        "Actualizado: " + ahora.toLocaleDateString() + " " + ahora.toLocaleTimeString();

    let totalProductos = productos.length;
    let categoriasUnicas = [...new Set(productos.map(p => p.categoria))];
    let valorInventario = productos.reduce((total, p) => total + (p.precio * p.stock), 0);
    let disponibles = productos.filter(p => p.stock > 0).length;
    let agotados = productos.filter(p => p.stock === 0).length;
    let bajoStockLista = productos.filter(p => p.stock <= 5);

    document.getElementById("kpiTotal").textContent = totalProductos;
    document.getElementById("kpiCategorias").textContent = categoriasUnicas.length;
    document.getElementById("kpiValor").textContent = valorInventario.toLocaleString() + " Bs";
    document.getElementById("kpiDisponibles").textContent = disponibles;
    document.getElementById("kpiAgotados").textContent = agotados;
    document.getElementById("kpiBajoStock").textContent = bajoStockLista.length;

    // Gráfico 1: Productos por categoría
    let conteoPorCategoria = categoriasUnicas.map(cat =>
        productos.filter(p => p.categoria === cat).length
    );

    new Chart(document.getElementById("graficoCategorias"), {
        type: "bar",
        data: {
            labels: categoriasUnicas,
            datasets: [{
                label: "Cantidad de Prendas",
                data: conteoPorCategoria,
                backgroundColor: "#f59e0b"
            }]
        }
    });

    // Gráfico 2: Distribución de stock
    let stockNormal = productos.filter(p => p.stock > 5).length;
    let stockBajo = productos.filter(p => p.stock > 0 && p.stock <= 5).length;

    new Chart(document.getElementById("graficoStock"), {
        type: "doughnut",
        data: {
            labels: ["Stock Normal (>5)", "Bajo Stock (1-5)", "Agotados (0)"],
            datasets: [{
                data: [stockNormal, stockBajo, agotados],
                backgroundColor: ["#059669", "#f59e0b", "#dc2626"]
            }]
        }
    });

    // Tabla de bajo inventario
    let tbody = document.getElementById("tablaBajoStock");
    tbody.innerHTML = "";
    bajoStockLista.forEach(p => {
        let estado = p.stock === 0
            ? '<span class="stock-agotado">Agotado</span>'
            : '<span class="stock-bajo">Bajo Stock</span>';

        let fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.categoria}</td>
            <td>${p.precio} Bs</td>
            <td>${p.stock}</td>
            <td>${estado}</td>
        `;
        tbody.appendChild(fila);
    });
}

// ==========================================
// 8. PREGUNTAS FRECUENTES (FAQ)
// ==========================================
document.querySelectorAll(".faq-pregunta").forEach(pregunta => {
    pregunta.addEventListener("click", function() {
        let respuesta = this.nextElementSibling;
        respuesta.style.display = respuesta.style.display === "block" ? "none" : "block";
    });
});

// Inicializar contador al cargar la página
actualizarContadorCarrito();
renderizarCarrito();