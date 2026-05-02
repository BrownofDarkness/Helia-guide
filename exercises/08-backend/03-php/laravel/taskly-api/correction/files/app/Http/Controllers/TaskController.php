<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $limit = (int) min($request->query('limit', 20), 100);
        $tasks = $request->user()
            ->tasks()
            ->latest()
            ->paginate($limit)
            ->withQueryString();

        return response()->json([
            'data' => $tasks->items(),
            'pagination' => [
                'total' => $tasks->total(),
                'page'  => $tasks->currentPage(),
                'limit' => $tasks->perPage(),
            ],
        ]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $request->user()->tasks()->create($request->validated());
        return response()->json($task, Response::HTTP_CREATED);
    }

    public function show(Request $request, Task $task): JsonResponse
    {
        $this->ensureOwner($request, $task);
        return response()->json($task);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->ensureOwner($request, $task);
        $task->update($request->validated());
        return response()->json($task->fresh());
    }

    public function destroy(Request $request, Task $task): Response
    {
        $this->ensureOwner($request, $task);
        $task->delete();
        return response()->noContent();
    }

    private function ensureOwner(Request $request, Task $task): void
    {
        if ($task->owner_id !== $request->user()->id) {
            abort(Response::HTTP_NOT_FOUND);
        }
    }
}
