import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { FlipHorizontal2, AlertTriangle } from 'lucide-react'

export default function BarcodeScanner({ onResult }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [devices, setDevices] = useState([])
  const [deviceIndex, setDeviceIndex] = useState(0)
  const [error, setError] = useState(null)
  const [scanned, setScanned] = useState(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.listVideoInputDevices().then(found => {
      if (found.length === 0) {
        setError('no-device')
        return
      }
      // Prefer rear camera on mobile
      const sorted = [...found].sort(d =>
        /back|rear|environment/i.test(d.label) ? -1 : 1
      )
      setDevices(sorted)
    }).catch(() => setError('permission'))

    return () => {
      reader.reset()
    }
  }, [])

  useEffect(() => {
    const reader = readerRef.current
    if (!reader || devices.length === 0 || !videoRef.current) return

    reader.reset()
    const deviceId = devices[deviceIndex]?.deviceId

    reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
      if (result && !scanned) {
        setScanned(true)
        reader.reset()
        onResult(result.getText())
      }
      // suppress continuous "not found" errors from zxing
    }).catch(() => setError('permission'))
  }, [devices, deviceIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  function flipCamera() {
    setDeviceIndex(i => (i + 1) % devices.length)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p className="text-sm text-amber-800 leading-relaxed max-w-xs">
          Camera unavailable. Make sure you're on HTTPS and have granted camera permission.
          Use the <span className="font-semibold">Search</span> tab instead.
        </p>
      </div>
    )
  }

  if (scanned) {
    return (
      <div className="flex items-center justify-center h-48 rounded-2xl bg-indigo-50 border border-indigo-200">
        <p className="text-sm text-indigo-700 font-medium">Barcode detected — fetching info…</p>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-[4/3]">
      {/* Live video */}
      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

      {/* Dark overlay with scanning window cutout via box-shadow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-56 h-36">
          {/* Semi-transparent surround */}
          <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />

          {/* Animated corner brackets */}
          <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl animate-pulse" />
          <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr animate-pulse" />
          <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl animate-pulse" />
          <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br animate-pulse" />

          {/* Scan line */}
          <div className="absolute left-1 right-1 h-0.5 bg-indigo-400/70 top-1/2 animate-bounce" />
        </div>
      </div>

      {/* Flip camera button */}
      {devices.length > 1 && (
        <button
          onClick={flipCamera}
          className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          aria-label="Flip camera"
        >
          <FlipHorizontal2 className="w-5 h-5" />
        </button>
      )}

      <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/70">
        Point at a barcode to scan
      </p>
    </div>
  )
}
