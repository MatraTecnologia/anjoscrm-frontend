import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Política de Privacidade — Kinar CRM',
    description: 'Política de privacidade e proteção de dados do Kinar CRM.',
}

export default function PrivacyPolicyPage() {
    const updated = '04 de maio de 2025'
    const company = 'Kinar CRM'
    const email = 'contato@kinarcrm.com.br'
    const site = 'https://kinarcrm.com.br'

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-3xl mx-auto px-6 py-16">

                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        ← Voltar
                    </Link>
                    <h1 className="text-3xl font-bold mt-6 mb-2">Política de Privacidade</h1>
                    <p className="text-sm text-muted-foreground">Última atualização: {updated}</p>
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

                    <section>
                        <h2 className="text-lg font-semibold mb-3">1. Quem somos</h2>
                        <p>
                            O <strong>{company}</strong> é uma plataforma de CRM (Customer Relationship Management)
                            desenvolvida para auxiliar empresas na gestão de leads, automações de atendimento e
                            integração com canais de comunicação, incluindo WhatsApp e Meta Lead Ads (Facebook e Instagram).
                            Nosso site é <a href={site} className="text-primary underline">{site}</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">2. Dados que coletamos</h2>
                        <p className="mb-3">Coletamos as seguintes categorias de dados:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong>Dados de cadastro:</strong> nome, e-mail e senha dos usuários que criam conta na plataforma.
                            </li>
                            <li>
                                <strong>Dados de leads:</strong> informações fornecidas pelos leads dos nossos clientes,
                                incluindo nome, e-mail, telefone e outros campos personalizados preenchidos em formulários
                                de captação.
                            </li>
                            <li>
                                <strong>Dados do Meta Lead Ads:</strong> quando o cliente conecta sua conta do Facebook ou
                                Instagram à plataforma, coletamos dados de leads submetidos nos formulários de anúncios de
                                cadastro (Lead Ads), como nome, e-mail e telefone, conforme autorizado pelo cliente durante
                                o processo de integração.
                            </li>
                            <li>
                                <strong>Dados de uso:</strong> informações sobre como a plataforma é utilizada, como páginas
                                acessadas, funcionalidades utilizadas e registros de acesso, para fins de segurança e melhoria
                                do serviço.
                            </li>
                            <li>
                                <strong>Dados de pagamento:</strong> informações de cobrança necessárias para processar
                                assinaturas. Dados de cartão são processados diretamente pelo provedor de pagamentos e não
                                são armazenados em nossos servidores.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">3. Como usamos os dados</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Fornecer, operar e melhorar a plataforma {company}.</li>
                            <li>Permitir que nossos clientes gerenciem seus leads e automações de atendimento.</li>
                            <li>
                                Importar e organizar leads captados via Meta Lead Ads nas contas conectadas pelos clientes,
                                exclusivamente para uso dentro da plataforma do próprio cliente.
                            </li>
                            <li>Enviar notificações sobre o serviço, como alertas de segurança e atualizações importantes.</li>
                            <li>Prevenir fraudes e garantir a segurança da plataforma.</li>
                            <li>Cumprir obrigações legais e regulatórias.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">4. Dados do Meta (Facebook e Instagram)</h2>
                        <p className="mb-3">
                            Quando um cliente conecta sua conta Meta à plataforma {company}, obtemos acesso aos dados
                            de leads dos formulários de anúncios de cadastro (Lead Ads) mediante autorização explícita
                            do cliente durante o fluxo de integração.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Os dados coletados via Meta são utilizados <strong>exclusivamente</strong> para popular o CRM do cliente que realizou a integração.</li>
                            <li>Não compartilhamos, vendemos ou utilizamos esses dados para fins publicitários ou de terceiros.</li>
                            <li>O cliente pode revogar o acesso a qualquer momento desconectando a integração na plataforma ou diretamente nas configurações do Facebook.</li>
                            <li>Os tokens de acesso são armazenados de forma segura e utilizados apenas para as operações autorizadas pelo cliente.</li>
                            <li>Cumprimos as <a href="https://developers.facebook.com/policy/" className="text-primary underline" target="_blank" rel="noopener noreferrer">Políticas da Plataforma Meta</a> e os termos de uso das APIs de Lead Ads.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">5. Compartilhamento de dados</h2>
                        <p className="mb-3">
                            Não vendemos dados pessoais. Podemos compartilhar dados com terceiros apenas nas seguintes
                            situações:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Provedores de serviço:</strong> empresas que nos auxiliam na operação da plataforma (hospedagem, envio de e-mails, processamento de pagamentos), sempre sob acordos de confidencialidade.</li>
                            <li><strong>Obrigação legal:</strong> quando exigido por lei, ordem judicial ou autoridade competente.</li>
                            <li><strong>Proteção de direitos:</strong> quando necessário para proteger os direitos, propriedade ou segurança do {company}, de nossos clientes ou de terceiros.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">6. Retenção de dados</h2>
                        <p>
                            Mantemos os dados pelo tempo necessário para a prestação dos serviços contratados e para
                            cumprimento de obrigações legais. Após o encerramento de uma conta, os dados são excluídos
                            ou anonimizados em até 90 dias, salvo quando a retenção for exigida por lei.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">7. Segurança</h2>
                        <p>
                            Adotamos medidas técnicas e organizacionais para proteger os dados contra acesso não
                            autorizado, perda, alteração ou divulgação. Isso inclui criptografia de dados sensíveis,
                            controle de acesso baseado em funções e monitoramento de segurança contínuo.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">8. Seus direitos (LGPD)</h2>
                        <p className="mb-3">
                            Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Confirmar a existência de tratamento de seus dados.</li>
                            <li>Acessar seus dados pessoais.</li>
                            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
                            <li>Revogar o consentimento a qualquer momento.</li>
                            <li>Portabilidade dos dados a outro fornecedor de serviço.</li>
                        </ul>
                        <p className="mt-3">
                            Para exercer qualquer desses direitos, entre em contato pelo e-mail{' '}
                            <a href={`mailto:${email}`} className="text-primary underline">{email}</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">9. Cookies</h2>
                        <p>
                            Utilizamos cookies estritamente necessários para manter sessões de usuário autenticadas.
                            Não utilizamos cookies para rastreamento publicitário.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">10. Alterações nesta política</h2>
                        <p>
                            Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas
                            por e-mail ou por aviso destacado na plataforma. O uso continuado após a notificação
                            implica aceite das alterações.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">11. Contato</h2>
                        <p>
                            Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em
                            contato com nosso encarregado de dados (DPO):
                        </p>
                        <p className="mt-2">
                            <strong>{company}</strong><br />
                            E-mail: <a href={`mailto:${email}`} className="text-primary underline">{email}</a><br />
                            Site: <a href={site} className="text-primary underline">{site}</a>
                        </p>
                    </section>

                </div>

                <div className="mt-16 pt-8 border-t text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} {company}. Todos os direitos reservados.</p>
                    <p className="mt-1">
                        <Link href="/termos-de-servico" className="hover:text-foreground transition-colors">
                            Termos de Serviço
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    )
}
