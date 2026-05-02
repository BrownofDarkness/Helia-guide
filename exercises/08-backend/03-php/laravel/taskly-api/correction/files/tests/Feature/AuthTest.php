<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('register endpoint creates a user and returns 201', function () {
    $response = $this->postJson('/api/auth/register', [
        'email'    => 'alice@example.com',
        'name'     => 'Alice',
        'password' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('email', 'alice@example.com')
        ->assertJsonMissing(['password']);

    $this->assertDatabaseHas('users', ['email' => 'alice@example.com']);
});

it('register fails with invalid data', function () {
    $response = $this->postJson('/api/auth/register', [
        'email'    => 'not-an-email',
        'name'     => '',
        'password' => '123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email', 'name', 'password']);
});

it('register fails with duplicate email', function () {
    User::factory()->create(['email' => 'alice@example.com']);

    $response = $this->postJson('/api/auth/register', [
        'email'    => 'alice@example.com',
        'name'     => 'Alice 2',
        'password' => 'password123',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['email']);
});

it('login returns a token on valid credentials', function () {
    User::factory()->create([
        'email'    => 'alice@example.com',
        'password' => bcrypt('password123'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email'    => 'alice@example.com',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['user', 'token']);
});

it('login fails on bad password', function () {
    User::factory()->create([
        'email'    => 'alice@example.com',
        'password' => bcrypt('password123'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email'    => 'alice@example.com',
        'password' => 'wrong',
    ]);

    $response->assertUnauthorized();
});

it('me returns the authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/auth/me')
        ->assertOk()
        ->assertJsonPath('email', $user->email);
});

it('me requires authentication', function () {
    $this->getJson('/api/auth/me')->assertUnauthorized();
});
