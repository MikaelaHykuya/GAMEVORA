import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[100dvh] bg-[#030303] text-white flex flex-col items-center justify-center p-8">
          <div className="max-w-md text-center">
            <p className="text-5xl mb-6">⚠️</p>
            <h2 className="text-xl font-black uppercase mb-4">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6 font-mono break-all">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 px-8 py-4 rounded-[22px] text-[10px] font-black uppercase active-scale"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
