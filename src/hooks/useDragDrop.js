import { useState, useRef, useCallback } from 'react';

/**
 * useDragDrop - 공통 드래그앤드롭 훅
 *
 * @param {Object} options
 * @param {function} options.onDrop - (draggedItem, dropZoneId) => 'correct' | 'wrong' | 'ignore'
 * @param {number} options.snapDistance - 드롭존 근처 자석 효과 거리 (px, default 40)
 *
 * @returns {Object}
 *  - makeDragProps(item) → onPointerDown handler props for draggable elements
 *  - makeDropProps(zoneId) → ref + style props for drop zones
 *  - dragging: current dragged item or null
 *  - dragPos: { x, y } screen position
 *  - nearZone: zoneId the drag is near, or null
 *  - ghostStyle: style object for the dragged ghost element
 *  - containerProps: spread on the outermost container (pointerMove/Up)
 */
export default function useDragDrop({ onDrop, snapDistance = 40 } = {}) {
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [nearZone, setNearZone] = useState(null);
  const [result, setResult] = useState(null); // { type: 'correct'|'wrong', item, zoneId }

  const originRef = useRef({ x: 0, y: 0 });
  const dropZones = useRef({}); // { zoneId: element }

  // Register a drop zone element
  const registerDropZone = useCallback((zoneId, element) => {
    if (element) {
      dropZones.current[zoneId] = element;
    } else {
      delete dropZones.current[zoneId];
    }
  }, []);

  // Check which drop zone the pointer is over
  function findNearestZone(x, y) {
    for (const [id, el] of Object.entries(dropZones.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const expanded = snapDistance;
      if (x >= r.left - expanded && x <= r.right + expanded &&
          y >= r.top - expanded && y <= r.bottom + expanded) {
        return id;
      }
    }
    return null;
  }

  function handlePointerDown(e, item) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    originRef.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    setDragging(item);
    setDragPos({ x: e.clientX, y: e.clientY });
    setResult(null);
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    e.preventDefault();
    setDragPos({ x: e.clientX, y: e.clientY });
    setNearZone(findNearestZone(e.clientX, e.clientY));
  }

  function handlePointerUp(e) {
    if (!dragging) return;
    e.preventDefault();
    const zone = findNearestZone(e.clientX, e.clientY);

    if (zone && onDrop) {
      const dropResult = onDrop(dragging, zone);
      if (dropResult === 'correct') {
        setResult({ type: 'correct', item: dragging, zoneId: zone });
        setTimeout(() => setResult(null), 500);
      } else if (dropResult === 'wrong') {
        setResult({ type: 'wrong', item: dragging, zoneId: zone });
        setTimeout(() => setResult(null), 500);
      }
    }

    setDragging(null);
    setNearZone(null);
  }

  // Props to spread on each draggable element
  function makeDragProps(item) {
    const isDragged = dragging === item;
    return {
      onPointerDown: (e) => handlePointerDown(e, item),
      style: {
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: isDragged ? 'grabbing' : 'grab',
        opacity: isDragged ? 0.3 : 1,
        transition: isDragged ? 'none' : 'opacity 0.2s ease',
        position: 'relative',
      },
    };
  }

  // Props for a drop zone
  function makeDropProps(zoneId) {
    const isNear = nearZone === zoneId;
    const wasCorrect = result?.type === 'correct' && result?.zoneId === zoneId;
    const wasWrong = result?.type === 'wrong' && result?.zoneId === zoneId;
    return {
      ref: (el) => registerDropZone(zoneId, el),
      isNear,
      wasCorrect,
      wasWrong,
    };
  }

  // Ghost element style (position: fixed, follows finger)
  const ghostStyle = dragging ? {
    position: 'fixed',
    left: dragPos.x,
    top: dragPos.y,
    transform: 'translate(-50%, -50%) scale(1.2)',
    pointerEvents: 'none',
    zIndex: 1000,
    transition: 'none',
  } : null;

  // Container props (pointerMove/Up)
  const containerProps = {
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };

  return {
    makeDragProps,
    makeDropProps,
    dragging,
    dragPos,
    nearZone,
    ghostStyle,
    containerProps,
    result,
  };
}
