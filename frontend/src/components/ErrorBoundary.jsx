import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5 text-center">
          <div className="card shadow-sm p-5 border-0 mx-auto" style={{ maxWidth: "550px", borderRadius: "18px" }}>
            <div style={{ fontSize: "48px" }} className="mb-3">⚠️</div>
            <h4 className="fw-bold text-dark mb-2">Something went wrong</h4>
            <p className="text-muted small mb-4">
              An unexpected error occurred while rendering this view.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-primary px-4 py-2"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/dashboard";
                }}
              >
                Return to Dashboard
              </button>
              <button
                className="btn btn-outline-secondary px-4 py-2"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
