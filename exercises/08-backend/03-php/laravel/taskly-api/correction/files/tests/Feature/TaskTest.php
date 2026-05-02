<?php

declare(strict_types=1);

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('lists tasks of the authenticated user only', function () {
    $alice = User::factory()->create();
    $bob   = User::factory()->create();
    Task::factory()->count(3)->for($alice, 'owner')->create();
    Task::factory()->count(2)->for($bob, 'owner')->create();

    $response = $this->actingAs($alice, 'sanctum')->getJson('/api/tasks');

    $response->assertOk()
        ->assertJsonPath('pagination.total', 3);
});

it('creates a task for the authenticated user', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/tasks', ['title' => 'Test task']);

    $response->assertCreated()
        ->assertJsonPath('title', 'Test task')
        ->assertJsonPath('owner_id', $user->id);
});

it('rejects task creation with invalid data', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/tasks', ['title' => '']);

    $response->assertUnprocessable()->assertJsonValidationErrors(['title']);
});

it('returns 404 when fetching another user\'s task', function () {
    $alice = User::factory()->create();
    $bob   = User::factory()->create();
    $bobsTask = Task::factory()->for($bob, 'owner')->create();

    $this->actingAs($alice, 'sanctum')
        ->getJson("/api/tasks/{$bobsTask->id}")
        ->assertNotFound();
});

it('updates own task', function () {
    $user = User::factory()->create();
    $task = Task::factory()->for($user, 'owner')->create(['done' => false]);

    $response = $this->actingAs($user, 'sanctum')
        ->patchJson("/api/tasks/{$task->id}", ['done' => true]);

    $response->assertOk()->assertJsonPath('done', true);
});

it('deletes own task', function () {
    $user = User::factory()->create();
    $task = Task::factory()->for($user, 'owner')->create();

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/tasks/{$task->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
});

it('requires authentication on /api/tasks', function () {
    $this->getJson('/api/tasks')->assertUnauthorized();
    $this->postJson('/api/tasks', ['title' => 'x'])->assertUnauthorized();
});
