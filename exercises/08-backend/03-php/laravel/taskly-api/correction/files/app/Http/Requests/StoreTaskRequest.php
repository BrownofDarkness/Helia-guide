<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => 'required|string|min:1|max:200',
            'description' => 'nullable|string|max:2000',
            'due_at'      => 'nullable|date',
        ];
    }
}
