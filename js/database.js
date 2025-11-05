// Configuración desde config.js
const config = window.CONFIG || {};

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        console.log('Base de datos inicializada (LocalStorage)');
        console.log('Aplicación:', config.APP_NAME || 'LONAS CADERAYTA');
        this.initializeSampleData();
    }

    init() {
        // Configura tus credenciales de Supabase aquí
        const supabaseUrl = 'https://bxndijuuhmcklkiemtqr.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bmRpanV1aG1ja2xraWVtdHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTE1MzAsImV4cCI6MjA3Nzg2NzUzMH0.kwGLHv_hqrVxtbS5oeiMEQYf-ebJLKOE1n05KLtEpFY';
        
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Supabase inicializado');
    }

    // Métodos para Pedidos
    async getPedidos(filtros = {}) {
        try {
            let query = this.supabase
                .from('pedidos')
                .select('*')
                .order('fecha_creacion', { ascending: false });

            // Aplicar filtros
            if (filtros.estado) {
                query = query.eq('estado', filtros.estado);
            }
            if (filtros.instalacion) {
                query = query.eq('instalacion', filtros.instalacion);
            }
            if (filtros.cliente) {
                query = query.ilike('cliente', `%${filtros.cliente}%`);
            }
            if (filtros.telefono) {
                query = query.ilike('telefono', `%${filtros.telefono}%`);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo pedidos:', error);
            throw error;
        }
    }

    async getPedidoById(id) {
        try {
            const { data, error } = await this.supabase
                .from('pedidos')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error obteniendo pedido:', error);
            throw error;
        }
    }

    async savePedido(pedido) {
        try {
            // Preparar datos para Supabase
            const pedidoData = {
                cliente: pedido.cliente,
                telefono: pedido.telefono,
                direccion: pedido.direccion,
                descripcion: pedido.descripcion,
                cantidad: pedido.cantidad,
                precio: pedido.precio,
                estado: pedido.estado,
                instalacion: pedido.instalacion,
                fecha_entrega: pedido.fechaEntrega,
                pago: pedido.pago,
                arte_aprobado: pedido.arteAprobado === 'si',
                vendedor: pedido.vendedor,
                fecha_actualizacion: new Date().toISOString()
            };

            let result;

            if (pedido.id) {
                // Actualizar pedido existente
                const { data, error } = await this.supabase
                    .from('pedidos')
                    .update(pedidoData)
                    .eq('id', pedido.id)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            } else {
                // Nuevo pedido
                // Obtener el último folio
                const { data: ultimoPedido } = await this.supabase
                    .from('pedidos')
                    .select('folio')
                    .order('fecha_creacion', { ascending: false })
                    .limit(1)
                    .single();

                let nuevoNumero = 1;
                if (ultimoPedido && ultimoPedido.folio) {
                    const ultimoNumero = parseInt(ultimoPedido.folio.split('-')[1]);
                    nuevoNumero = ultimoNumero + 1;
                }

                pedidoData.folio = `LN-00${nuevoNumero}`;
                pedidoData.fecha_creacion = new Date().toISOString();

                const { data, error } = await this.supabase
                    .from('pedidos')
                    .insert([pedidoData])
                    .select()
                    .single();

                if (error) throw error;
                result = data;

                // Crear entrada en el historial
                await this.agregarHistorial(result.id, 'Pedido creado');
            }

            return result;
        } catch (error) {
            console.error('Error guardando pedido:', error);
            throw error;
        }
    }

    async deletePedido(id) {
        try {
            const { error } = await this.supabase
                .from('pedidos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error eliminando pedido:', error);
            throw error;
        }
    }

    // Métodos para Rentas
    async getRentas(filtros = {}) {
        try {
            let query = this.supabase
                .from('rentas')
                .select('*')
                .order('fecha_creacion', { ascending: false });

            if (filtros.estado) {
                query = query.eq('estado', filtros.estado);
            }
            if (filtros.cliente) {
                query = query.ilike('cliente', `%${filtros.cliente}%`);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo rentas:', error);
            throw error;
        }
    }

    async saveRenta(renta) {
        try {
            const rentaData = {
                cliente: renta.cliente,
                telefono: renta.telefono,
                direccion_entrega: renta.direccion,
                articulo: renta.articulo,
                fecha_entrega: renta.fechaEntrega,
                fecha_devolucion: renta.fechaDevolucion,
                monto_total: renta.monto,
                deposito: renta.deposito === 'si',
                estado: renta.estado
            };

            let result;

            if (renta.id) {
                // Actualizar renta existente
                const { data, error } = await this.supabase
                    .from('rentas')
                    .update(rentaData)
                    .eq('id', renta.id)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            } else {
                // Nueva renta
                const { data: ultimaRenta } = await this.supabase
                    .from('rentas')
                    .select('folio')
                    .order('fecha_creacion', { ascending: false })
                    .limit(1)
                    .single();

                let nuevoNumero = 1;
                if (ultimaRenta && ultimaRenta.folio) {
                    const ultimoNumero = parseInt(ultimaRenta.folio.split('-')[1]);
                    nuevoNumero = ultimoNumero + 1;
                }

                rentaData.folio = `RN-00${nuevoNumero}`;
                rentaData.fecha_creacion = new Date().toISOString();

                const { data, error } = await this.supabase
                    .from('rentas')
                    .insert([rentaData])
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            }

            return result;
        } catch (error) {
            console.error('Error guardando renta:', error);
            throw error;
        }
    }

    // Métodos para estadísticas
    async getEstadisticas() {
        try {
            const hoy = new Date().toISOString().split('T')[0];
            
            // Pedidos del día
            const { data: pedidosHoy, error: error1 } = await this.supabase
                .from('pedidos')
                .select('id')
                .gte('fecha_creacion', `${hoy}T00:00:00Z`)
                .lte('fecha_creacion', `${hoy}T23:59:59Z`);

            // Pendientes de autorización
            const { data: pendientes, error: error2 } = await this.supabase
                .from('pedidos')
                .select('id')
                .eq('estado', 'pendiente');

            // En producción
            const { data: produccion, error: error3 } = await this.supabase
                .from('pedidos')
                .select('id')
                .eq('estado', 'produccion');

            // Instalaciones pendientes
            const { data: instalaciones, error: error4 } = await this.supabase
                .from('pedidos')
                .select('id')
                .eq('instalacion', 'pendiente');

            // Rentas activas
            const { data: rentasActivas, error: error5 } = await this.supabase
                .from('rentas')
                .select('id')
                .eq('estado', 'activa');

            if (error1 || error2 || error3 || error4 || error5) {
                throw new Error('Error obteniendo estadísticas');
            }

            return {
                pedidosHoy: pedidosHoy?.length || 0,
                pendientesAutorizacion: pendientes?.length || 0,
                enProduccion: produccion?.length || 0,
                instalacionesPendientes: instalaciones?.length || 0,
                rentasActivas: rentasActivas?.length || 0
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    // Método para historial
    async agregarHistorial(pedidoId, accion, usuario = 'Sistema') {
        try {
            const { error } = await this.supabase
                .from('historial_pedidos')
                .insert([{
                    pedido_id: pedidoId,
                    accion: accion,
                    usuario: usuario
                }]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error agregando historial:', error);
            throw error;
        }
    }

    async getHistorialPorPedido(pedidoId) {
        try {
            const { data, error } = await this.supabase
                .from('historial_pedidos')
                .select('*')
                .eq('pedido_id', pedidoId)
                .order('fecha', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            throw error;
        }
    }

    // Autenticación
    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;
        return data;
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    getCurrentUser() {
        return this.supabase.auth.getUser();
    }

    onAuthStateChange(callback) {
        return this.supabase.auth.onAuthStateChange(callback);
    }
}

// Instancia global de la base de datos
const db = new Database();