// Funcionalidades generales de la aplicación

class App {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Event listeners globales
        document.addEventListener('DOMContentLoaded', () => {
            this.initializePage();
        });
    }

    initializePage() {
        // Inicializar componentes según la página
        const currentPage = window.location.pathname.split('/').pop();
        
        switch(currentPage) {
            case 'index.html':
            case '':
                this.initializeDashboard();
                break;
            case 'pedidos.html':
                this.initializePedidos();
                break;
            case 'nuevo.html':
                this.initializeNuevoPedido();
                break;
            case 'rentas.html':
                this.initializeRentas();
                break;
            case 'entregas.html':
                this.initializeEntregas();
                break;
            case 'detalle.html':
                this.initializeDetalle();
                break;
        }
    }

    async initializeDashboard() {
        try {
            const stats = await db.getEstadisticas();
            this.updateDashboardStats(stats);
            await this.cargarPedidosRecientes();
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
            this.showError('Error al cargar el dashboard');
        }
    }

    updateDashboardStats(stats) {
        // Actualizar las tarjetas de estadísticas
        const elements = {
            pedidosHoy: document.querySelector('.bg-white.rounded-lg.shadow.p-4:first-child .text-2xl'),
            pendientesAutorizacion: document.querySelector('.bg-white.rounded-lg.shadow.p-4:nth-child(2) .text-2xl'),
            enProduccion: document.querySelector('.bg-white.rounded-lg.shadow.p-4:nth-child(3) .text-2xl'),
            instalacionesPendientes: document.querySelector('.bg-white.rounded-lg.shadow.p-4:nth-child(4) .text-2xl')
        };

        if (elements.pedidosHoy) elements.pedidosHoy.textContent = stats.pedidosHoy;
        if (elements.pendientesAutorizacion) elements.pendientesAutorizacion.textContent = stats.pendientesAutorizacion;
        if (elements.enProduccion) elements.enProduccion.textContent = stats.enProduccion;
        if (elements.instalacionesPendientes) elements.instalacionesPendientes.textContent = stats.instalacionesPendientes;
    }

    async cargarPedidosRecientes() {
        try {
            const pedidos = await db.getPedidos();
            const pedidosRecientes = pedidos.slice(0, 5); // Últimos 5 pedidos
            
            const tbody = document.getElementById('tablaPedidosRecientes');
            if (!tbody) return;

            tbody.innerHTML = pedidosRecientes.map(pedido => `
                <tr class="fade-in">
                    <td class="px-6 py-4 whitespace-nowrap">${pedido.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${pedido.cliente}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getEstadoClass(pedido.estado)}">
                            ${this.getEstadoText(pedido.estado)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getInstalacionClass(pedido.instalacion)}">
                            ${this.getInstalacionText(pedido.instalacion)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${this.formatDate(pedido.fechaEntrega)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href="detalle.html?id=${pedido.id}" class="text-blue-600 hover:text-blue-900">Ver</a>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error cargando pedidos recientes:', error);
        }
    }

    // Utilidades
    getEstadoClass(estado) {
        const classes = {
            'pendiente': 'estado-pendiente',
            'autorizado': 'estado-autorizado',
            'no-autorizado': 'estado-no-autorizado',
            'produccion': 'estado-produccion',
            'listo': 'estado-listo',
            'entregado': 'estado-entregado',
            'cancelado': 'estado-cancelado'
        };
        return classes[estado] || 'estado-pendiente';
    }

    getEstadoText(estado) {
        const textos = {
            'pendiente': 'Pendiente',
            'autorizado': 'Autorizado',
            'no-autorizado': 'No Autorizado',
            'produccion': 'En Producción',
            'listo': 'Listo',
            'entregado': 'Entregado',
            'cancelado': 'Cancelado'
        };
        return textos[estado] || 'Pendiente';
    }

    getInstalacionClass(instalacion) {
        return instalacion === 'instalada' ? 'instalacion-instalada' : 'instalacion-pendiente';
    }

    getInstalacionText(instalacion) {
        return instalacion === 'instalada' ? 'Instalada' : 'Pendiente';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX');
    }

    showError(message) {
        // Implementar notificación de error
        console.error('Error:', message);
        alert(message); // Reemplazar con SweetAlert2 en producción
    }

    showSuccess(message) {
        // Implementar notificación de éxito
        console.log('Éxito:', message);
        alert(message); // Reemplazar con SweetAlert2 en producción
    }
}

// Inicializar la aplicación
const app = new App();

// Funciones globales
function generarFolio() {
    const contador = parseInt(localStorage.getItem('contador') || '124');
    return `LN-00${contador + 1}`;
}

function validarTelefono(telefono) {
    const regex = /^[0-9+\-\s()]{10,}$/;
    return regex.test(telefono);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}