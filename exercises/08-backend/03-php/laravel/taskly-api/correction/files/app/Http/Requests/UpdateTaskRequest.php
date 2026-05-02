<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => 'sometimes|string|min:1|max:200',
            'description' => 'nullable|string|max:2000',
            'due_at'      => 'nullable|date',
            'done'        => 'sometimes|boolean',
        ];
    }
}
