/**
 * Aviso de sesión por inactividad (JavaScript puro, sin librerías).
 *
 * - Si el usuario no interactúa durante TIEMPO_INACTIVIDAD, se muestra
 *   un modal con cuenta regresiva y el botón "Seguir conectado".
 * - Al llegar a 0 cierra la sesión enviando el formulario de logout
 *   del menú de usuario (POST /logout con su token CSRF).
 *
 * Se carga en todas las páginas del panel mediante config/adminlte.php.
 */
(function () {
    'use strict';

    const TIEMPO_INACTIVIDAD = 2 * 60 * 1000; // 2 minutos
    const SEGUNDOS_CUENTA = 60;           // duración de la cuenta regresiva

    // Acciones que cuentan como "actividad" del usuario.
    const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    let temporizadorInactividad = null; // setTimeout de inactividad
    let intervaloCuenta = null;         // setInterval de la cuenta regresiva
    let segundosRestantes = SEGUNDOS_CUENTA;
    let modalVisible = false;

    let modal, backdrop, textoCuenta, mensaje, boton;

    function crearModal() {
        // Se usan las clases de Bootstrap para el estilo, pero se abre y
        // cierra manualmente, sin depender del JavaScript de Bootstrap.
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.tabIndex = -1;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'tituloInactividad');

        modal.innerHTML =
            '<div class="modal-dialog modal-dialog-centered">' +
                '<div class="modal-content">' +
                    '<div class="modal-header bg-warning">' +
                        '<h5 class="modal-title" id="tituloInactividad">¿Sigues ahí?</h5>' +
                    '</div>' +
                    '<div class="modal-body text-center">' +
                        '<p class="mensaje-inactividad mb-2">' +
                            'Tu sesión se cerrará por inactividad en:' +
                        '</p>' +
                        '<p class="display-4 fw-bold mb-0 cuenta-inactividad">' + SEGUNDOS_CUENTA + '</p>' +
                        '<small class="text-muted">segundos</small>' +
                    '</div>' +
                    '<div class="modal-footer justify-content-center">' +
                        '<button type="button" class="btn btn-primary">Seguir conectado</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade';

        textoCuenta = modal.querySelector('.cuenta-inactividad');
        mensaje = modal.querySelector('.mensaje-inactividad');
        boton = modal.querySelector('button');

        boton.addEventListener('click', seguirConectado);

        document.body.appendChild(modal);
    }

    function mostrarModal() {
        modalVisible = true;
        segundosRestantes = SEGUNDOS_CUENTA;
        textoCuenta.textContent = segundosRestantes;
        mensaje.textContent = 'Tu sesión se cerrará por inactividad en:';

        document.body.appendChild(backdrop);
        document.body.classList.add('modal-open');
        modal.style.display = 'block';

        // Pequeña pausa para que se note la animación "fade" de Bootstrap.
        setTimeout(function () {
            modal.classList.add('show');
            backdrop.classList.add('show');
            boton.focus();
        }, 10);

        intervaloCuenta = setInterval(function () {
            segundosRestantes--;
            textoCuenta.textContent = segundosRestantes;

            if (segundosRestantes <= 0) {
                clearInterval(intervaloCuenta);
                cerrarSesion();
            }
        }, 1000);
    }

    function ocultarModal() {
        modalVisible = false;
        clearInterval(intervaloCuenta);

        modal.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.classList.remove('modal-open');

        setTimeout(function () {
            modal.style.display = 'none';
            backdrop.remove();
        }, 150);
    }

    function cerrarSesion() {
        mensaje.textContent = 'Cerrando sesión por inactividad...';
        boton.disabled = true;

        // Se reutiliza el formulario "Cerrar sesión" del menú de usuario,
        // que ya incluye el token CSRF que Laravel exige en un POST.
        const formulario = document.getElementById('form-cerrar-sesion');

        if (!formulario) {
            // Respaldo: al recargar, si la sesión ya no es válida,
            // el middleware "auth" redirige al login.
            window.location.reload();
            return;
        }

        // Campo extra para que el login muestre el motivo del cierre.
        const motivo = document.createElement('input');
        motivo.type = 'hidden';
        motivo.name = 'motivo';
        motivo.value = 'inactividad';
        formulario.appendChild(motivo);

        formulario.submit();
    }

    function reiniciarTemporizador() {
        // Mientras el modal está abierto, mover el mouse NO lo cierra:
        // el usuario debe confirmar con el botón.
        if (modalVisible) {
            return;
        }

        clearTimeout(temporizadorInactividad);
        temporizadorInactividad = setTimeout(mostrarModal, TIEMPO_INACTIVIDAD);
    }

    function seguirConectado() {
        ocultarModal();
        reiniciarTemporizador();
    }

    document.addEventListener('DOMContentLoaded', function () {
        crearModal();

        EVENTOS_ACTIVIDAD.forEach(function (evento) {
            // passive: true evita afectar el rendimiento del scroll.
            document.addEventListener(evento, reiniciarTemporizador, { passive: true });
        });

        reiniciarTemporizador();
    });
})();