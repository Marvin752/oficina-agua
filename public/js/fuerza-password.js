/**
 * Indicador de fuerza de contraseña (JavaScript puro, sin librerías).
 *
 * Uso: agregar el atributo data-fuerza-password a cualquier
 * <input type="password"> y cargar este archivo en la vista.
 * El indicador se crea automáticamente debajo del campo.
 */
(function () {
    'use strict';

    // Criterios evaluados. Cada uno que se cumple suma 1 punto.
    const CRITERIOS = [
        { id: 'longitud',  texto: 'Al menos 8 caracteres',        prueba: (v) => v.length >= 8 },
        { id: 'larga',     texto: '12 caracteres o más',          prueba: (v) => v.length >= 12 },
        { id: 'mayuscula', texto: 'Una letra mayúscula',          prueba: (v) => /[A-ZÁÉÍÓÚÑ]/.test(v) },
        { id: 'numero',    texto: 'Un número',                    prueba: (v) => /[0-9]/.test(v) },
        { id: 'simbolo',   texto: 'Un símbolo (!@#$%&*...)',      prueba: (v) => /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(v) },
    ];

    // Nivel según puntaje (0 a 5).
    const NIVELES = {
        debil:  { texto: 'Débil',  clase: 'bg-danger',  porcentaje: 33 },
        media:  { texto: 'Media',  clase: 'bg-warning', porcentaje: 66 },
        fuerte: { texto: 'Fuerte', clase: 'bg-success', porcentaje: 100 },
    };

    function evaluar(valor) {
        const cumplidos = CRITERIOS.filter((c) => c.prueba(valor)).map((c) => c.id);
        const puntaje = cumplidos.length;

        let nivel = 'debil';

        // Menos de 8 caracteres siempre es débil (es el mínimo del sistema).
        if (valor.length >= 8) {
            if (puntaje === 5) {
                nivel = 'fuerte';
            } else if (puntaje >= 3) {
                nivel = 'media';
            }
        }

        return { nivel, cumplidos };
    }

    function crearIndicador(input) {
        const contenedor = document.createElement('div');
        contenedor.className = 'fuerza-password mt-2';
        contenedor.style.display = 'none';

        contenedor.innerHTML =
            '<div class="progress" style="height: 6px;">' +
                '<div class="progress-bar" role="progressbar" style="width: 0%;"></div>' +
            '</div>' +
            '<small class="d-block mt-1">Seguridad: <strong class="fuerza-texto"></strong></small>' +
            '<ul class="list-unstyled small mb-0 mt-1">' +
                CRITERIOS.map((c) =>
                    '<li data-criterio="' + c.id + '" class="text-muted">' +
                        '<span class="icono">✗</span> ' + c.texto +
                    '</li>'
                ).join('') +
            '</ul>';

        // Se inserta después del texto de ayuda si existe, si no, después del input.
        const ayuda = input.parentElement.querySelector('.form-text');
        (ayuda || input).insertAdjacentElement('afterend', contenedor);

        return contenedor;
    }

    function actualizar(input, contenedor) {
        const valor = input.value;

        // Campo vacío: se oculta (útil en editar, donde la contraseña es opcional).
        if (valor === '') {
            contenedor.style.display = 'none';
            return;
        }

        contenedor.style.display = 'block';

        const { nivel, cumplidos } = evaluar(valor);
        const datos = NIVELES[nivel];

        const barra = contenedor.querySelector('.progress-bar');
        barra.className = 'progress-bar ' + datos.clase;
        barra.style.width = datos.porcentaje + '%';

        const texto = contenedor.querySelector('.fuerza-texto');
        texto.textContent = datos.texto;
        texto.className = 'fuerza-texto ' + datos.clase.replace('bg-', 'text-');

        contenedor.querySelectorAll('[data-criterio]').forEach((li) => {
            const ok = cumplidos.includes(li.dataset.criterio);
            li.className = ok ? 'text-success' : 'text-muted';
            li.querySelector('.icono').textContent = ok ? '✓' : '✗';
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('input[data-fuerza-password]').forEach((input) => {
            const contenedor = crearIndicador(input);

            // 'input' se dispara en cada tecla, pegado o borrado: tiempo real.
            input.addEventListener('input', () => actualizar(input, contenedor));

            // Por si el navegador autocompleta el campo al cargar.
            actualizar(input, contenedor);
        });
    });
})();