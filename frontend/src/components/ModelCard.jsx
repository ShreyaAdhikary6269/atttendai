import { RefreshCw, Play, AlertTriangle, PlugZap } from 'lucide-react';

function when(v) {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString('en-IN');
}

export default function ModelCard({ service, error, model, busy, canPredict, onRefresh, onTrain, onPredict }) {
  const trained = model && model.status === 'TRAINED';
  const insufficient = model && model.status === 'INSUFFICIENT_DATA';

  return (
    <div className="card">
      <div className="card-head">
        <h3 className="card-title">Decision Tree model</h3>
        <span className={'pill-status ' + service}>
          {service === 'checking' ? 'Checking...' : service === 'online' ? 'Connected' : 'Not connected'}
        </span>
      </div>

      {service === 'offline' && (
        <div className="notice warn">
          <PlugZap size={18} />
          <div>
            <b>The prediction service is not connected.</b> No predictions can be made.
            <div className="small">{error}</div>
          </div>
        </div>
      )}

      {service === 'online' && !model.trained && !insufficient && (
        <div className="notice info">No model has been trained yet. Train it to get predictions.</div>
      )}

      {insufficient && (
        <div className="notice warn">
          <AlertTriangle size={18} />
          <div>
            <b>The last training run stopped: not enough data.</b>
            <div className="small">{model.notes || 'Add more attendance history and train again.'}</div>
          </div>
        </div>
      )}

      {trained && (
        <div className="kv-list">
          <div><span>Algorithm</span><b>{model.algorithm || 'Decision Tree'}</b></div>
          <div><span>Trained at</span><b>{when(model.trained_at)}</b></div>
          <div><span>Training examples</span><b>{model.train_rows ?? '-'}</b></div>
          <div><span>Test examples</span><b>{model.test_rows ?? '-'}</b></div>
          <div>
            <span>Test accuracy</span>
            <b>{model.test_accuracy === null || model.test_accuracy === undefined ? '-' : (model.test_accuracy * 100).toFixed(1) + '%'}</b>
          </div>
        </div>
      )}
      {trained && (
        <p className="muted small">
          Accuracy is measured on test students the model did not see while training. With small datasets it can swing a lot, so treat it as a rough guide.
        </p>
      )}

      <div className="btn-row no-print">
        <button className="btn" onClick={onRefresh} disabled={busy !== ''}>
          <RefreshCw size={15} style={{ verticalAlign: 'middle' }} /> Check connection
        </button>
        <button className="btn" onClick={onTrain} disabled={service !== 'online' || busy !== ''}>
          {busy === 'train' ? 'Training...' : 'Train model'}
        </button>
        <button className="btn btn-primary" onClick={onPredict} disabled={!canPredict || busy !== ''}>
          <Play size={15} style={{ verticalAlign: 'middle' }} /> {busy === 'predict' ? 'Predicting...' : 'Run predictions'}
        </button>
      </div>
    </div>
  );
}
