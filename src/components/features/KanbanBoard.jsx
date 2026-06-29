import { useState, useCallback, useMemo, useEffect } from 'react';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useUpdateRecord } from 'lemma-sdk/react';
import { client } from '../../lib/lemma';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const COLUMNS = [
  { id: 'todo', label: 'To do' },
  { id: 'inprogress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

function Column({ col, tasks, readOnly, isOver, draggingTask }) {
  const { setNodeRef } = useDroppable({
    id: col.id,
    data: {
      type: 'Column',
      col,
    }
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
      {/* Column header */}
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

      {/* Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} draggable={!readOnly} />
          ))}
        </SortableContext>
      </div>

      {/* Add task button */}
      {!readOnly && (
        <button style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginTop: 10, width: '100%', height: 36,
          border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-md)',
          background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
          fontSize: 12, fontFamily: 'var(--font-sans)', transition: 'all var(--duration-fast)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border-accent)';
          e.currentTarget.style.color = 'var(--text-accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-default)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}>
          <Plus size={14} /> Add task
        </button>
      )}
    </div>
  );
}

export function KanbanBoard({ tasks: initialTasks, readOnly = false }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState(null);
  const [activeOver, setActiveOver] = useState(null);
  const updateTask = useUpdateRecord({ client, tableName: '' });

  // Sync with upstream prop if the DB updates externally
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);


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

    // Find what we are dropping on
    let destinationStatus = null;
    const isOverColumn = COLUMNS.some(c => c.id === overId);

    if (isOverColumn) {
      destinationStatus = overId;
    } else {
      // Over a task
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) destinationStatus = overTask.status;
    }

    if (!destinationStatus) return;

    const task = tasks.find(t => t.id === activeId);
    if (!task) return;

    const wasNotDone = task.status !== 'done';
    const nowDone = destinationStatus === 'done';

    setTasks((prev) => {
      return prev.map(t => {
        if (t.id === activeId) {
          return { ...t, status: destinationStatus };
        }
        return t;
      });
    });

    if (destinationStatus !== task.status) {
      updateTask.mutateAsync({ id: activeId, updates: { status: destinationStatus } }).catch(err => {
        console.error("Failed to update task status in Kanban:", err);
      });
    }

    if (wasNotDone && nowDone) {
      confetti({
        particleCount: 350,
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
  }, [tasks]);

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: 16, flex: 1, overflowX: 'auto', padding: '0 24px 24px' }}>
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
              readOnly={readOnly}
              isOver={isColOver}
              draggingTask={activeTask}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskCard task={activeTask} isOverlay={true} draggable={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
