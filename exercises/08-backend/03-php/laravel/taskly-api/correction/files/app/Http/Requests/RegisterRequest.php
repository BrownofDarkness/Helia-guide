<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => 'required|email|unique:users,email',
            'name'     => 'required|string|min:1|max:100',
            'password' => 'required|string|min:8|max:200',
        ];
    }
}
