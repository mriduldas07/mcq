export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-sm space-y-4">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">MCQ Platform</h1>
                    <p className="text-sm text-muted-foreground">
                        Teacher Portal
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
}
