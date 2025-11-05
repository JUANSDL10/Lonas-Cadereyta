// Gestión de la página de pedidos

class PedidosManager {
    constructor() {
        this.pedidos = [];
        this.filtros = {};
        this.init();
    }

    async init() {
        await this.cargarPedidos();
        this.setupEventListeners();
        this.aplicarFiltrosDesdeURL();
    }

    async cargarPedidos(filtros = {}) {
        try {
            this.pedidos = await db.getPedidos(filtros);
            this.renderPedidos();
            this.actualizarContador();
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            app.showError('Error al cargar los pedidos');
        }
    }

    renderPedidos() {
        const tbody = document.getElementById('tablaPedidos');
        if (!tbody) return;

        if (this.pedidos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No se encontraron pedidos
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.pedidos.map(pedido => `
            <tr class="fade-in hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap font-medium">${pedido.id}</td>
                <td class="px-6 py-4 whitespace-nowrap">${pedido.cliente}</td>
                <td class="px-6 py-4 whitespace-nowrap">${pedido.telefono}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge ${app.getEstadoClass(pedido.estado)}">
                        ${app.getEstadoText(pedido.estado)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge ${app.getInstalacionClass(pedido.instalacion)}">
                        ${app.getInstalacionText(pedido.instalacion)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${app.formatDate(pedido.fechaEntrega)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <a href="detalle.html?id=${pedido.id}" class="text-blue-600 hover:text-blue-900">
                        <i class="fas fa-eye"></i>
                    </a>
                    <a href="nuevo.html?editar=${pedido.id}" class="text-green-600 hover:text-green-900">
                        <i class="fas fa-edit"></i>
                    </a>
                    <button onclick="pedidosManager.eliminarPedido('${pedido.id}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    actualizarContador() {
        const contador = document.getElementById('totalPedidos');
        if (contador) {
            contador.textContent = this.pedidos.length;
        }
    }

    setupEventListeners() {
        const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
        const btnExportarExcel = document.getElementById('btnExportarExcel');

        if (btnAplicarFiltros) {
            btnAplicarFiltros.addEventListener('click', () => this.aplicarFiltros());
        }

        if (btnExportarExcel) {
            btnExportarExcel.addEventListener('click', () => this.exportarExcel());
        }

        // Enter en campos de filtro
        const inputsFiltro = document.querySelectorAll('#filtroCliente, #filtroTelefono');
        inputsFiltro.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.aplicarFiltros();
                }
            });
        });
    }

    aplicarFiltros() {
        this.filtros = {
            cliente: document.getElementById('filtroCliente')?.value || '',
            telefono: document.getElementById('filtroTelefono')?.value || '',
            estado: document.getElementById('filtroEstado')?.value || '',
            instalacion: document.getElementById('filtroInstalacion')?.value || ''
        };

        this.cargarPedidos(this.filtros);
    }

    aplicarFiltrosDesdeURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const filter = urlParams.get('filter');
        
        if (filter) {
            const filtroEstado = document.getElementById('filtroEstado');
            if (filtroEstado) {
                const estadoMap = {
                    'pending': 'pendiente',
                    'authorized': 'autorizado',
                    'production': 'produccion'
                };
                
                if (estadoMap[filter]) {
                    filtroEstado.value = estadoMap[filter];
                    this.aplicarFiltros();
                }
            }
        }
    }

    async eliminarPedido(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
            return;
        }

        try {
            await db.deletePedido(id);
            app.showSuccess('Pedido eliminado correctamente');
            await this.cargarPedidos(this.filtros);
        } catch (error) {
            console.error('Error eliminando pedido:', error);
            app.showError('Error al eliminar el pedido');
        }
    }

    exportarExcel() {
        // Implementar exportación a Excel
        // Por ahora, exportar como CSV
        const headers = ['Folio', 'Cliente', 'Teléfono', 'Estado', 'Instalación', 'Fecha Entrega', 'Precio'];
        const data = this.pedidos.map(p => [
            p.id,
            p.cliente,
            p.telefono,
            app.getEstadoText(p.estado),
            app.getInstalacionText(p.instalacion),
            app.formatDate(p.fechaEntrega),
            `$${p.precio}`
        ]);

        const csvContent = [
            headers.join(','),
            ...data.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Inicializar el manager de pedidos
const pedidosManager = new PedidosManager();