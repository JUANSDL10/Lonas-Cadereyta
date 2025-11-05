// Gestión de la página de detalle de pedido

class DetalleManager {
    constructor() {
        this.pedido = null;
        this.init();
    }

    async init() {
        await this.cargarPedido();
        this.setupEventListeners();
    }

    async cargarPedido() {
        const urlParams = new URLSearchParams(window.location.search);
        const pedidoId = urlParams.get('id');
        
        if (!pedidoId) {
            app.showError('No se especificó un pedido');
            window.location.href = 'pedidos.html';
            return;
        }

        try {
            this.pedido = await db.getPedidoById(pedidoId);
            if (!this.pedido) {
                app.showError('Pedido no encontrado');
                window.location.href = 'pedidos.html';
                return;
            }

            this.renderDetalle();
            this.generarQR();
            
        } catch (error) {
            console.error('Error cargando detalle del pedido:', error);
            app.showError('Error al cargar el pedido');
        }
    }

    renderDetalle() {
        // Información principal
        this.actualizarElemento('detalleFolio', this.pedido.id);
        this.actualizarElemento('detalleCliente', this.pedido.cliente);
        this.actualizarElemento('detalleTelefono', this.pedido.telefono);
        this.actualizarElemento('detalleDireccion', this.pedido.direccion);
        this.actualizarElemento('detalleDescripcion', this.pedido.descripcion);
        
        // Estados
        this.actualizarEstado('detalleEstado', this.pedido.estado);
        this.actualizarInstalacion('detalleInstalacion', this.pedido.instalacion);
        this.actualizarPago('detallePago', this.pedido.pago);
        
        // Información adicional
        this.actualizarElemento('detalleFechaEntrega', app.formatDate(this.pedido.fechaEntrega));
        this.actualizarElemento('detalleArte', this.pedido.arteAprobado === 'si' ? 'Sí' : 'No');
        this.actualizarElemento('detalleVendedor', this.pedido.vendedor || '-');
        this.actualizarElemento('detalleFechaCreacion', app.formatDate(this.pedido.fechaCreacion));
        
        // Información de precio
        this.actualizarElemento('detalleCantidad', this.pedido.cantidad);
        this.actualizarElemento('detallePrecioUnitario', formatCurrency(this.pedido.precio / this.pedido.cantidad));
        this.actualizarElemento('detallePrecioTotal', formatCurrency(this.pedido.precio));
        
        // Historial
        this.renderHistorial();
    }

    actualizarElemento(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor || '-';
        }
    }

    actualizarEstado(id, estado) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = app.getEstadoText(estado);
            elemento.className = `px-2 py-1 rounded-full text-xs font-medium ${app.getEstadoClass(estado)}`;
        }
    }

    actualizarInstalacion(id, instalacion) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = app.getInstalacionText(instalacion);
            elemento.className = `px-2 py-1 rounded-full text-xs font-medium ${app.getInstalacionClass(instalacion)}`;
        }
    }

    actualizarPago(id, pago) {
        const elemento = document.getElementById(id);
        if (elemento) {
            const textos = {
                'pendiente': 'Pendiente',
                'parcial': 'Parcial',
                'pagado': 'Pagado'
            };
            
            const clases = {
                'pendiente': 'estado-pendiente',
                'parcial': 'estado-produccion',
                'pagado': 'estado-entregado'
            };
            
            elemento.textContent = textos[pago] || 'Pendiente';
            elemento.className = `px-2 py-1 rounded-full text-xs font-medium ${clases[pago] || 'estado-pendiente'}`;
        }
    }

    renderHistorial() {
        const contenedor = document.getElementById('historialPedido');
        if (!contenedor || !this.pedido.historial) return;

        if (this.pedido.historial.length === 0) {
            contenedor.innerHTML = '<p class="text-gray-500 text-center py-4">No hay historial disponible</p>';
            return;
        }

        // Ordenar historial por fecha (más reciente primero)
        const historialOrdenado = [...this.pedido.historial].sort((a, b) => 
            new Date(b.fecha) - new Date(a.fecha)
        );

        contenedor.innerHTML = historialOrdenado.map(item => `
            <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">${item.accion}</p>
                    <p class="text-xs text-gray-500">
                        Por ${item.usuario} • ${this.formatFechaCompleta(item.fecha)}
                    </p>
                </div>
            </div>
        `).join('');
    }

    formatFechaCompleta(fechaString) {
        const fecha = new Date(fechaString);
        return fecha.toLocaleString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    generarQR() {
        const qrContainer = document.getElementById('qrcode');
        if (!qrContainer) return;

        const url = `${window.location.origin}${window.location.pathname}?id=${this.pedido.id}`;
        
        // Limpiar contenedor
        qrContainer.innerHTML = '';
        
        // Generar QR
        QRCode.toCanvas(url, { 
            width: 128,
            height: 128,
            margin: 1
        }, function(err, canvas) {
            if (err) {
                console.error('Error generando QR:', err);
                qrContainer.innerHTML = '<p class="text-sm text-gray-500">Error generando QR</p>';
                return;
            }
            
            qrContainer.appendChild(canvas);
        });
    }

    setupEventListeners() {
        const btnImprimir = document.getElementById('btnImprimir');
        const btnEditar = document.getElementById('btnEditar');

        if (btnImprimir) {
            btnImprimir.addEventListener('click', () => this.imprimirDetalle());
        }

        if (btnEditar) {
            btnEditar.addEventListener('click', () => this.editarPedido());
        }
    }

    imprimirDetalle() {
        window.print();
    }

    editarPedido() {
        if (this.pedido) {
            window.location.href = `nuevo.html?editar=${this.pedido.id}`;
        }
    }
}

// Inicializar el manager de detalle
const detalleManager = new DetalleManager();