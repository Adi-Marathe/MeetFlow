import { useState, useCallback, useMemo } from 'react';
import { TaskCard } from './TaskCard';
import confetti from 'canvas-confetti';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const COLUMNS = [
  { id: 'todo', label: 'To do' },
  { id: 'inprogress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

function Column({ col, tasks, isOver, draggingTask }) {
  const { setNodeRef } = useDroppable({
    id: col.id,
    data: { type: 'Column', col }
  });

  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: 280,
        background: isOver && draggingTask?.status !== col.id ? 'var(--accent-subtle)' : 'var(--bg-surface)',
        border: `1px solid ${isOver && draggingTask?.status !== col.id ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        borderTop: `4px solid ${
          col.id === 'todo' ? 'var(--status-todo)' :
          col.id === 'inprogress' ? 'var(--status-inprogress)' : 'var(--status-done)'
        }`,
        borderRadius: 'var(--radius-xl)',
        padding: 12,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background var(--duration-fast), border-color var(--duration-fast)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, padding: '4px 4px 8px', borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: col.id === 'todo' ? 'var(--status-todo)' :
              col.id === 'inprogress' ? 'var(--status-inprogress)' : 'var(--status-done)',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {col.label}
          </span>
        </div>
        <span style={{
          fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)',
          padding: '2px 7px', borderRadius: 'var(--radius-full)', fontWeight: 500,
        }}>
          {tasks.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: 13, minHeight: 100,
          }}>
            No tasks here
          </div>
        ) : (
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} draggable hideOwner showMeetingSource />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

export function MyTasksKanban({ tasks, onStatusChange }) {
  const [activeTask, setActiveTask] = useState(null);
  const [activeOver, setActiveOver] = useState(null);

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task);
  }, [tasks]);

  const handleDragOver = useCallback((event) => {
    const { over } = event;
    setActiveOver(over?.id || null);
  }, []);

  const handleDragEnd = useCallback((event) => {
    setActiveTask(null);
    setActiveOver(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    let destinationStatus = null;
    const isOverColumn = COLUMNS.some(c => c.id === overId);

    if (isOverColumn) {
      destinationStatus = overId;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) destinationStatus = overTask.status;
    }

    if (!destinationStatus) return;

    const task = tasks.find(t => t.id === activeId);
    if (!task) return;
    if (task.status === destinationStatus) return;

    const wasNotDone = task.status !== 'done';
    const nowDone = destinationStatus === 'done';

    // Call upstream handler
    onStatusChange(activeId, destinationStatus);

    if (wasNotDone && nowDone) {
      confetti({
        particleCount: 80,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#cf7336', '#e8956a', '#d4914a', '#2a8a5e', '#faf9f7'],
        shapes: ['square'],
        scalar: 0.8,
        gravity: 1.2,
        drift: 0,
        ticks: 200
      });
    }
  }, [tasks, onStatusChange]);

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: 16, height: '100%', minHeight: 400, flex: 1, overflowX: 'auto', paddingBottom: 16, paddingLeft: 4, paddingRight: 4 }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          
          let isColOver = false;
          if (activeOver) {
            if (activeOver === col.id) {
              isColOver = true;
            } else {
              const overTask = tasks.find(t => t.id === activeOver);
              if (overTask && overTask.status === col.id) {
                isColOver = true;
              }
            }
          }

          return (
            <Column
              key={col.id}
              col={col}
              tasks={colTasks}
              isOver={isColOver}
              draggingTask={activeTask}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask ? (
          <TaskCard task={activeTask} isOverlay hideOwner showMeetingSource />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
