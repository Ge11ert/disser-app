import React from 'react';

const FileSelector = () => {
  const onClick = () => {
    // fix of "Object could not be cloned"
    window.electron.loadAirConditions();
  };

  return (
    <div className="file-selector">
      <p className="file-selector__prompt">
        Загрузите файл с текущими полётными условиями:
        <button
          className="file-selector__button"
          onClick={onClick}
        >
          Open a file
        </button>
      </p>
      <p className="file-selector__result"/>
    </div>
  );
}

export default FileSelector;
