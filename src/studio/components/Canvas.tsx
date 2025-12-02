
'use client';

export default function Canvas() {
    return (
        <div className="bg-white mx-auto shadow-lg" style={{ width: '8.5in', height: '11in' }}>
            <div className="w-full h-full relative" id="canvas">
                {/* Mock element for visual representation */}
                <div className="absolute top-20 left-20 p-2 border-2 border-dashed border-primary cursor-move bg-primary/10">
                    <p className="text-4xl font-headline" style={{ color: 'hsl(var(--primary))' }}>Your Company</p>
                </div>
                <div className="absolute top-40 left-20 p-2 border-2 border-dashed border-transparent hover:border-primary cursor-move">
                    <p className="text-lg">This is a sample text element. You can drag it around.</p>
                </div>
            </div>
        </div>
    );
}
