<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Solo acepta contraseñas FUERTES.
 *
 * Usa los mismos criterios que el indicador visual
 * (public/js/fuerza-password.js), para que el navegador
 * y el servidor digan exactamente lo mismo:
 *
 * - 8 caracteres o más
 * - 12 caracteres o más
 * - una letra mayúscula
 * - un número
 * - un símbolo
 *
 * Cada criterio suma 1 punto. Solo con los 5 puntos
 * (contraseña fuerte) se acepta.
 */
class ContrasenaSegura implements ValidationRule
{
    private const PUNTAJE_MINIMO = 5;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $valor = (string) $value;

        $puntaje = 0;

        if (mb_strlen($valor) >= 8) {
            $puntaje++;
        }

        if (mb_strlen($valor) >= 12) {
            $puntaje++;
        }

        if (preg_match('/[A-ZÁÉÍÓÚÑ]/u', $valor)) {
            $puntaje++;
        }

        if (preg_match('/[0-9]/', $valor)) {
            $puntaje++;
        }

        if (preg_match('/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/u', $valor)) {
            $puntaje++;
        }

        if ($puntaje < self::PUNTAJE_MINIMO) {
            $fail(
                'La contraseña debe ser fuerte: 12 caracteres o más, '
                . 'con al menos una mayúscula, un número y un símbolo.'
            );
        }
    }
}