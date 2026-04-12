import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          margin: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>
            ⚠️ Something went wrong
          </h2>
          <p style={{ color: '#7f1d1d', marginBottom: '1rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {import.meta.env.DEV && this.state.errorInfo && (
            <details style={{ 
              marginTop: '1rem',
              textAlign: 'left',
              backgroundColor: '#fef2f2',
              padding: '1rem',
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}>
              <summary style={{ cursor: 'pointer', color: '#b91c1c' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{ 
                marginTop: '0.5rem',
                overflow: 'auto',
                maxHeight: '200px',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
