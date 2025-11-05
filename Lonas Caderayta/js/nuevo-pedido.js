// Gestión del formulario de nuevo pedido

class NuevoPedidoManager {
    constructor() {
        this.pedidoId = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.cargarDatosIniciales();
        this.cargarPedidoDesdeURL();
    }

    setupEventListeners() {
        const form = document.getElementById('formNuevoPedido');
        if (form) {
            form.addEventListener('submit', (e) => this.guardarPedido(e));
        }

        // Auto-generar folio
        const folioInput = document.getElementById('folio');
        if (folioInput) {
            folioInput.value = generarFolio();
        }

        // Validación en tiempo real
        this.setupValidaciones();
    }

    setupValidaciones() {
        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput) {
            telefonoInput.addEventListener('blur', () => {
                if (telefonoInput.value && !validarTelefono(telefonoInput.value)) {
                    this.mostrarError(telefonoInput, 'Formato de teléfono inválido');
                } else {
                    this.removerError(telefonoInput);
                }
            });
        }

        const precioInput = document.getElementById('precio');
        if (precioInput) {
            precioInput.addEventListener('input', () => {
                if (precioInput.value < 0) {
                    precioInput.value = 0;
                }
            });
        }
    }

    mostrarError(input, mensaje) {
        this.removerError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-600 text-sm mt-1';
        errorDiv.textContent = mensaje;
        
        input.classList.add('border-red-500');
        input.parentNode.appendChild(errorDiv);
    }

    removerError(input) {
        input.classList.remove('border-red-500');
        const errorDiv = input.parentNode.querySelector('.text-red-600');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    async cargarDatosIniciales() {
        // Establecer fecha mínima para entrega (hoy)
        const fechaEntregaInput = document.getElementById('fechaEntrega');
        if (fechaEntregaInput) {
            const hoy = new Date().toISOString().split('T')[0];
            fechaEntregaInput.min = hoy;
        }
    }

    cargarPedidoDesdeURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const pedidoId = urlParams.get('editar');
        
        if (pedidoId) {
            this.cargarPedidoParaEditar(pedidoId);
        }
    }

    async cargarPedidoParaEditar(id) {
        try {
            const pedido = await db.getPedidoById(id);
            if (pedido) {
                this.pedidoId = id;
                this.llenarFormulario(pedido);
                
                // Cambiar título
                const titulo = document.querySelector('h1');
                if (titulo) {
                    titulo.textContent = 'Editar Pedido';
                }
                
                const subtitulo = document.querySelector('p.text-gray-600');
                if (subtitulo) {
                    subtitulo.textContent = 'Modifique la información del pedido';
                }
            }
        } catch (error) {
            console.error('Error cargando pedido para editar:', error);
            app.showError('Error al cargar el pedido');
        }
    }

    llenarFormulario(pedido) {
        const campos = [
            'folio', 'cliente', 'telefono', 'direccion', 'descripcion',
            'cantidad', 'precio', 'estado', 'instalacion', 'fechaEntrega',
            'pago', 'arteAprobado', 'vendedor'
        ];

        campos.forEach(campo => {
            const input = document.getElementById(campo);
            if (input && pedido[campo] !== undefined) {
                input.value = pedido[campo];
            }
        });

        // El folio no debe ser editable
        const folioInput = document.getElementById('folio');
        if (folioInput) {
            folioInput.readOnly = true;
        }
    }

    async guardarPedido(e) {
        e.preventDefault();
        
        if (!this.validarFormulario()) {
            return;
        }

        try {
            const pedidoData = this.obtenerDatosFormulario();
            
            await db.savePedido(pedidoData);
            
            const mensaje = this.pedidoId ? 
                'Pedido actualizado correctamente' : 
                'Pedido creado correctamente';
            
            app.showSuccess(mensaje);
            
            // Redirigir después de guardar
            setTimeout(() => {
                window.location.href = 'pedidos.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error guardando pedido:', error);
            app.showError('Error al guardar el pedido');
        }
    }

    validarFormulario() {
        let valido = true;
        const camposRequeridos = [
            'cliente', 'telefono', 'direccion', 'descripcion',
            'cantidad', 'precio', 'fechaEntrega'
        ];

        camposRequeridos.forEach(campoId => {
            const input = document.getElementById(campoId);
            if (input && !input.value.trim()) {
                this.mostrarError(input, 'Este campo es requerido');
                valido = false;
            }
        });

        // Validar teléfono
        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput && telefonoInput.value && !validarTelefono(telefonoInput.value)) {
            this.mostrarError(telefonoInput, 'Formato de teléfono inválido');
            valido = false;
        }

        return valido;
    }

    obtenerDatosFormulario() {
        const pedido = {
            cliente: document.getElementById('cliente').value,
            telefono: document.getElementById('telefono').value,
            direccion: document.getElementById('direccion').value,
            descripcion: document.getElementById('descripcion').value,
            cantidad: parseInt(document.getElementById('cantidad').value),
            precio: parseFloat(document.getElementById('precio').value),
            estado: document.getElementById('estado').value,
            instalacion: document.getElementById('instalacion').value,
            fechaEntrega: document.getElementById('fechaEntrega').value,
            pago: document.getElementById('pago').value,
            arteAprobado: document.getElementById('arteAprobado').value,
            vendedor: document.getElementById('vendedor').value
        };

        if (this.pedidoId) {
            pedido.id = this.pedidoId;
        }

        return pedido;
    }
}

// Inicializar el manager de nuevo pedido
const nuevoPedidoManager = new NuevoPedidoManager();