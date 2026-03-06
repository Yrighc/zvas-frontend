import { Card, CardBody, Skeleton } from "@heroui/react";

interface AuditSummaryProps {
    total: number;
    highRiskCount: number;
    failureCount: number;
    actorCount: number;
    isLoading?: boolean;
}

export const AuditSummary = ({ total, highRiskCount, failureCount, actorCount, isLoading }: AuditSummaryProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-auto md:h-[110px]">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="bg-apple-tertiary-bg/10 border border-white/5 h-24 shadow-none">
                        <CardBody className="p-5 flex flex-col justify-center">
                            <Skeleton className="h-3 w-20 mb-2 rounded-full" />
                            <Skeleton className="h-8 w-12 rounded-lg" />
                        </CardBody>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[130px]">
            {/* 总量 */}
            <Card className="bg-apple-tertiary-bg/5 border border-white/5 backdrop-blur-3xl h-full shadow-none apple-spotlight rounded-[32px]">
                <CardBody className="p-6 flex flex-col justify-center">
                    <span className="text-[10px] text-apple-blue-light uppercase tracking-[0.3em] font-black opacity-80">Full_Access_Log</span>
                    <strong className="text-4xl font-black tracking-tighter mt-1 text-white leading-none">{total}</strong>
                </CardBody>
            </Card>

            {/* 高风险记录 */}
            <Card className="bg-apple-tertiary-bg/5 border border-white/5 backdrop-blur-3xl h-full shadow-none apple-spotlight rounded-[32px]">
                <CardBody className="p-6 flex flex-col justify-center">
                    <span className="text-[10px] text-apple-red-light uppercase tracking-[0.3em] font-black opacity-80 mb-1">Critical_Alert</span>
                    <strong className="text-4xl font-black tracking-tighter text-white leading-none">{highRiskCount}</strong>
                </CardBody>
            </Card>

            {/* 失败动作 */}
            <Card className="bg-apple-tertiary-bg/5 border border-white/5 backdrop-blur-3xl h-full shadow-none apple-spotlight rounded-[32px]">
                <CardBody className="p-6 flex flex-col justify-center">
                    <span className="text-[10px] text-apple-text-tertiary uppercase tracking-[0.3em] font-black opacity-80 mb-1">Execution_Fail</span>
                    <strong className="text-4xl font-black tracking-tighter text-white leading-none">{failureCount}</strong>
                </CardBody>
            </Card>

            {/* 操作主体人数 */}
            <Card className="bg-apple-tertiary-bg/5 border border-white/5 backdrop-blur-3xl h-full shadow-none apple-spotlight rounded-[32px]">
                <CardBody className="p-6 flex flex-col justify-center">
                    <span className="text-[10px] text-apple-blue-light uppercase tracking-[0.3em] font-black opacity-80 mb-1">Mirror_Actors</span>
                    <strong className="text-4xl font-black tracking-tighter text-white leading-none">{actorCount}</strong>
                </CardBody>
            </Card>
        </section>
    );
};
