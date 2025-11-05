// Gestión de la página de rentas

class RentasManager {
    constructor() {
        this.rentas = [];
        this.filtros = {};
        this.init();
    }

    async init() {
        await this.cargarRentas();
        this.setupEventListeners();
    }

    async cargarRentas(filtros = {}) {
        try {
            this.rentas = await db.getRentas(filtros);
            this.renderRentas();
            this.actualizarContador();
        } catch (error) {
            console.error('Error cargando rentas:', error);
            app.showError('Error al cargar las rentas');
        }
    }

    renderRentas() {
        const tbody = document.getElementById('tablaRentas');
        if (!tbody) return;

        if (this.rentas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                        No se encontraron rentas
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.rentas.map(renta => `
            <tr class="fade-in hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap font-medium">${renta.id}</td>
                <td class="px-6 py-4 whitespace-nowrap">${renta.cliente}</td>
                <td class="px-6 py-4 whitespace-nowrap">${renta.telefono}</td>
                <td class="px-6 py-4 whitespace-nowrap">${renta.articulo}</td>
                <td class="px-6 py-4 whitespace-nowrap">${app.formatDate(renta.fechaEntrega)}</td>
                <td class="px-6 py-4 whitespace-nowrap">${app.formatDate(renta.fechaDevolucion)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge ${this.getEstadoClass(renta.estado)}">
                        ${this.getEstadoText(renta.estado)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="rentasManager.editarRenta('${renta.id}')" class="text-green-600 hover:text-green-900">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="rentasManager.eliminarRenta('${renta.id}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getEstadoClass(estado) {
        const classes = {
            'activa': 'estado-autorizado',
            'vencida': 'estado-no-autorizado',
            'devuelta': 'estado-entregado',
            'pendiente': 'estado-pendiente'
        };
        return classes[estado] || 'estado-pendiente';
    }

    getEstadoText(estado) {
        const textos = {
            'activa': 'Activa',
            'vencida': 'Vencida',
            'devuelta': 'Devuelta',
            'pendiente': 'Pendiente'
        };
        return textos[estado] || 'Pendiente';
    }

    actualizarContador() {
        const contador = document.getElementById('totalRentas');
        if (contador) {
            contador.textContent = this.rentas.length;
        }
    }

    setupEventListeners() {
        const btnNuevaRenta = document.getElementById('btnNuevaRenta');
        const btnAplicarFiltros = document.getElementById('btnAplicarFiltrosRenta');
        const btnCancelarRenta = document.getElementById('btnCancelarRenta');
        const modal = document.getElementById('modalRenta');
        const form = document.getElementById('formNuevaRenta');

        if (btnNuevaRenta) {
            btnNuevaRenta.addEventListener('click', () => this.mostrarModal());
        }

        if (btnAplicarFiltros) {
            btnAplicarFiltros.addEventListener('click', () => this.aplicarFiltros());
        }

        if (btnCancelarRenta) {
            btnCancelarRenta.addEventListener('click', () => this.ocultarModal());
        }

        if (form) {
            form.addEventListener('submit', (e) => this.guardarRenta(e));
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
            estado: document.getElementById('filtroEstadoRenta')?.value || '',
            cliente: document.getElementById('filtroClienteRenta')?.value || '',
            fecha: document.getElementById('filtroFechaRenta')?.value || ''
        };

        this.cargarRentas(this.filtros);
    }

    mostrarModal() {
        const modal = document.getElementById('modalRenta');
        const folioInput = document.getElementById('rentaFolio');
        
        if (modal && folioInput) {
            folioInput.value = `RN-00${parseInt(localStorage.getItem('contador_rentas') || '1') + 1}`;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    ocultarModal() {
        const modal = document.getElementById('modalRenta');
        const form = document.getElementById('formNuevaRenta');
        
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        
        if (form) {
            form.reset();
        }
    }

    async guardarRenta(e) {
        e.preventDefault();
        
        try {
            const rentaData = {
                cliente: document.getElementById('rentaCliente').value,
                telefono: document.getElementById('rentaTelefono').value,
                direccion: document.getElementById('rentaDireccion').value,
                articulo: document.getElementById('rentaArticulo').value,
                fechaEntrega: document.getElementById('rentaFechaEntrega').value,
                fechaDevolucion: document.getElementById('rentaFechaDevolucion').value,
                monto: parseFloat(document.getElementById('rentaMonto').value),
                deposito: document.getElementById('rentaDeposito').value,
                estado: 'activa'
            };

            await db.saveRenta(rentaData);
            
            app.showSuccess('Renta guardada correctamente');
            this.ocultarModal();
            await this.cargarRentas(this.filtros);
            
        } catch (error) {
            console.error('Error guardando renta:', error);
            app.showError('Error al guardar la renta');
        }
    }

    async editarRenta(id) {
        // Implementar edición de renta
        console.log('Editar renta:', id);
        app.showError('Funcionalidad en desarrollo');
    }

    async eliminarRenta(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta renta?')) {
            return;
        }

        try {
            // Implementar eliminación de renta
            console.log('Eliminar renta:', id);
            app.showError('Funcionalidad en desarrollo');
        } catch (error) {
            console.error('Error eliminando renta:', error);
            app.showError('Error al eliminar la renta');
        }
    }
}

// Inicializar el manager de rentas
const rentasManager = new RentasManager();