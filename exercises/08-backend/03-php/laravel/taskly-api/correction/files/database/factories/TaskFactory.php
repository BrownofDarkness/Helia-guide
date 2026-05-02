<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'owner_id'    => User::factory(),
            'title'       => fake()->sentence(),
            'description' => fake()->paragraph(),
            'done'        => false,
        ];
    }
}
