import React from 'react';

const PathfinderController = () => {
  const onClick = () => {
    // fix of "Object could not be cloned"
    window.electron.findPath();
  };

  return (
    <div className="pathfinder-controller">
      <button
        className="pathfinder-controller__start"
        onClick={onClick}
      >
        Найти путь
      </button>
    </div>
  );
};

export default PathfinderController;
