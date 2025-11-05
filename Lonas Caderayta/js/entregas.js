// Gestión de la página de entregas e instalaciones

class EntregasManager {
    constructor() {
        this.pedidos = [];
        this.filtros = {};
        this.init();
    }

    async init() {
        await this.cargarPedidos();
        this.setupEventListeners();
    }

    async cargarPedidos(filtros = {}) {
        try {
            // Cargar solo pedidos que estén listos para entrega o instalación
            const todosPedidos = await db.getPedidos(filtros);
            this.pedidos = todosPedidos.filter(pedido => 
                pedido.estado === 'autorizado' || 
                pedido.estado === 'listo' || 
                pedido.estado === 'produccion' ||
                pedido.instalacion === 'pendiente'
            );
            
            this.renderPedidos();
        } catch (error) {
            console.error('Error cargando pedidos para entrega:', error);
            app.showError('Error al cargar los pedidos');
        }
    }

    renderPedidos() {
        const tbody = document.getElementById('tablaEntregas');
        if (!tbody) return;

        if (this.pedidos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No se encontraron pedidos para entrega
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.pedidos.map(pedido => `
            <tr class="fade-in hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap font-medium">${pedido.id}</td>
                <td class="px-6 py-4 whitespace-nowrap">${pedido.cliente}</td>
                <td class="px-6 py-4 whitespace-nowrap line-clamp-2" title="${pedido.direccion}">
                    ${pedido.direccion}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${pedido.telefono}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge ${this.getEstadoEntregaClass(pedido)}">
                        ${this.getEstadoEntregaText(pedido)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge ${app.getInstalacionClass(pedido.instalacion)}">
                        ${app.getInstalacionText(pedido.instalacion)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="entregasManager.mostrarModalActualizar('${pedido.id}')" 
                            class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                        Actualizar
                    </button>
                    <a href="detalle.html?id=${pedido.id}" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            </tr>
        `).join('');
    }

    getEstadoEntregaClass(pedido) {
        // Lógica simplificada para determinar estado de entrega
        if (pedido.estado === 'entregado') return 'estado-entregado';
        if (pedido.estado === 'listo') return 'estado-listo';
        return 'estado-pendiente';
    }

    getEstadoEntregaText(pedido) {
        if (pedido.estado === 'entregado') return 'Entregado';
        if (pedido.estado === 'listo') return 'Listo para Entrega';
        return 'Pendiente';
    }

    setupEventListeners() {
        const btnAplicarFiltros = document.getElementById('btnAplicarFiltrosEntrega');
        const btnCancelarEntrega = document.getElementById('btnCancelarEntrega');
        const modal = document.getElementById('modalEntrega');
        const form = document.getElementById('formActualizarEntrega');
        const estadoInstalacion = document.getElementById('estadoInstalacion');

        if (btnAplicarFiltros) {
            btnAplicarFiltros.addEventListener('click', () => this.aplicarFiltros());
        }

        if (btnCancelarEntrega) {
            btnCancelarEntrega.addEventListener('click', () => this.ocultarModal());
        }

        if (estadoInstalacion) {
            estadoInstalacion.addEventListener('change', (e) => {
                this.toggleCamposInstalacion(e.target.value);
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => this.actualizarEstado(e));
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.ocultarModal();
                }
            });
        }
    }

    aplicarFiltros() {
        this.filtros = {
            entrega: document.getElementById('filtroEntrega')?.value || '',
            instalacion: document.getElementById('filtroInstalacion')?.value || '',
            fecha: document.getElementById('filtroFechaEntrega')?.value || ''
        };

        this.cargarPedidos(this.filtros);
    }

    async mostrarModalActualizar(pedidoId) {
        try {
            const pedido = await db.getPedidoById(pedidoId);
            if (!pedido) {
                app.showError('Pedido no encontrado');
                return;
            }

            const modal = document.getElementById('modalEntrega');
            const pedidoIdInput = document.getElementById('pedidoId');
            const estadoEntrega = document.getElementById('estadoEntrega');
            const estadoInstalacion = document.getElementById('estadoInstalacion');

            if (modal && pedidoIdInput && estadoEntrega && estadoInstalacion) {
                pedidoIdInput.value = pedidoId;
                estadoEntrega.value = pedido.estado === 'entregado' ? 'entregado' : 'pendiente';
                estadoInstalacion.value = pedido.instalacion;
                
                this.toggleCamposInstalacion(pedido.instalacion);
                
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        } catch (error) {
            console.error('Error mostrando modal:', error);
            app.showError('Error al cargar los datos del pedido');
        }
    }

    toggleCamposInstalacion(estadoInstalacion) {
        const campoInstalador = document.getElementById('campoInstalador');
        const campoFirma = document.getElementById('campoFirma');

        if (estadoInstalacion === 'realizada') {
            campoInstalador?.classList.remove('hidden');
            campoFirma?.classList.remove('hidden');
        } else {
            campoInstalador?.classList.add('hidden');
            campoFirma?.classList.add('hidden');
        }
    }

    ocultarModal() {
        const modal = document.getElementById('modalEntrega');
        const form = document.getElementById('formActualizarEntrega');
        
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        
        if (form) {
            form.reset();
        }
    }

    async actualizarEstado(e) {
        e.preventDefault();
        
        try {
            const pedidoId = document.getElementById('pedidoId').value;
            const estadoEntrega = document.getElementById('estadoEntrega').value;
            const estadoInstalacion = document.getElementById('estadoInstalacion').value;
            const instalador = document.getElementById('instalador').value;
            const firma = document.getElementById('firma').value;

            const datosActualizacion = {
                estado: estadoEntrega === 'entregado' ? 'entregado' : 'listo',
                instalacion: estadoInstalacion
            };

            // Agregar información adicional si está disponible
            if (instalador) {
                datosActualizacion.instalador = instalador;
            }
            if (firma) {
                datosActualizacion.recibio = firma;
            }

            await db.savePedido({ id: pedidoId, ...datosActualizacion });
            
            // Agregar al historial
            let accion = 'Estado actualizado';
            if (estadoEntrega === 'entregado') {
                accion = 'Pedido marcado como entregado';
            }
            if (estadoInstalacion === 'realizada') {
                accion += ' e instalación completada';
            }
            
            await db.agregarHistorial(pedidoId, accion);

            app.showSuccess('Estado actualizado correctamente');
            this.ocultarModal();
            await this.cargarPedidos(this.filtros);
            
        } catch (error) {
            console.error('Error actualizando estado:', error);
            app.showError('Error al actualizar el estado');
        }
    }
}

// Inicializar el manager de entregas
const entregasManager = new EntregasManager();