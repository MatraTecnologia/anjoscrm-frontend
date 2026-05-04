import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Termos de Serviço — Kinar CRM',
    description: 'Termos de serviço e condições de uso do Kinar CRM.',
}

export default function TermsOfServicePage() {
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
                    <h1 className="text-3xl font-bold mt-6 mb-2">Termos de Serviço</h1>
                    <p className="text-sm text-muted-foreground">Última atualização: {updated}</p>
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

                    <section>
                        <h2 className="text-lg font-semibold mb-3">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar ou utilizar a plataforma <strong>{company}</strong>, você concorda com estes
                            Termos de Serviço e com nossa{' '}
                            <Link href="/politica-de-privacidade" className="text-primary underline">
                                Política de Privacidade
                            </Link>
                            . Se você não concordar com qualquer parte destes termos, não utilize a plataforma.
                        </p>
                        <p className="mt-3">
                            Estes termos se aplicam a todos os usuários da plataforma, incluindo visitantes, clientes
                            e qualquer pessoa que acesse ou utilize os serviços do {company}.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">2. Descrição do Serviço</h2>
                        <p>
                            O <strong>{company}</strong> é uma plataforma de CRM (Customer Relationship Management)
                            fornecida como Software como Serviço (SaaS), que oferece:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li>Gestão de leads e contatos.</li>
                            <li>Automações de atendimento e fluxos de comunicação.</li>
                            <li>Integração com canais de comunicação, incluindo WhatsApp.</li>
                            <li>Integração com Meta Lead Ads (Facebook e Instagram) para captação de leads.</li>
                            <li>Relatórios e dashboards de desempenho.</li>
                            <li>Ferramentas de gestão de equipes e permissões.</li>
                        </ul>
                        <p className="mt-3">
                            Nos reservamos o direito de modificar, suspender ou descontinuar qualquer funcionalidade
                            a qualquer momento, com aviso prévio razoável.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">3. Cadastro e Conta</h2>
                        <p className="mb-3">Para utilizar o {company}, você deve:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Ter pelo menos 18 anos de idade ou a maioridade legal em sua jurisdição.</li>
                            <li>Fornecer informações verdadeiras, precisas e completas durante o cadastro.</li>
                            <li>Manter suas credenciais de acesso em sigilo e não compartilhá-las com terceiros.</li>
                            <li>Notificar imediatamente o {company} em caso de uso não autorizado de sua conta.</li>
                        </ul>
                        <p className="mt-3">
                            Você é responsável por todas as atividades realizadas em sua conta. O {company} não se
                            responsabiliza por perdas decorrentes do uso não autorizado de suas credenciais.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">4. Planos e Pagamentos</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong>Assinatura:</strong> O {company} é oferecido mediante assinatura mensal ou
                                anual, conforme os planos disponíveis no site.
                            </li>
                            <li>
                                <strong>Cobrança:</strong> O valor da assinatura é cobrado antecipadamente no início
                                de cada período de faturamento.
                            </li>
                            <li>
                                <strong>Cancelamento:</strong> Você pode cancelar sua assinatura a qualquer momento.
                                O acesso permanece ativo até o fim do período pago.
                            </li>
                            <li>
                                <strong>Reembolsos:</strong> Não oferecemos reembolsos proporcionais por cancelamento
                                antecipado, salvo em casos previstos em lei.
                            </li>
                            <li>
                                <strong>Inadimplência:</strong> Em caso de falha no pagamento, o acesso à plataforma
                                poderá ser suspenso até a regularização.
                            </li>
                            <li>
                                <strong>Alteração de preços:</strong> Podemos alterar os preços com aviso prévio de
                                30 dias. O novo preço se aplicará na próxima renovação após a notificação.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">5. Integrações com Terceiros</h2>

                        <h3 className="font-medium mt-4 mb-2">5.1 Meta (Facebook e Instagram)</h3>
                        <p className="mb-3">
                            A integração com o Meta Lead Ads permite importar leads de formulários de anúncios do
                            Facebook e Instagram para o {company}. Ao conectar sua conta Meta:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Você autoriza o {company} a acessar os dados de leads dos seus formulários de anúncios.</li>
                            <li>
                                Você declara ter o direito de coletar e processar esses dados, em conformidade com
                                as{' '}
                                <a
                                    href="https://developers.facebook.com/policy/"
                                    className="text-primary underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Políticas da Plataforma Meta
                                </a>{' '}
                                e a legislação aplicável.
                            </li>
                            <li>Você pode revogar o acesso a qualquer momento nas configurações da plataforma.</li>
                            <li>
                                O {company} não se responsabiliza pelo uso indevido de dados de leads coletados
                                sem o consentimento adequado dos titulares.
                            </li>
                        </ul>

                        <h3 className="font-medium mt-4 mb-2">5.2 WhatsApp</h3>
                        <p>
                            O uso da integração com WhatsApp está sujeito aos termos de uso da API utilizada.
                            É proibido utilizar o {company} para envio de spam, mensagens não solicitadas ou
                            qualquer prática que viole as políticas do WhatsApp.
                        </p>

                        <h3 className="font-medium mt-4 mb-2">5.3 Outros Serviços</h3>
                        <p>
                            Integrações com outros serviços de terceiros estão sujeitas aos respectivos termos de
                            uso desses serviços. O {company} não se responsabiliza pela disponibilidade ou
                            funcionamento de serviços de terceiros.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">6. Uso Aceitável</h2>
                        <p className="mb-3">Ao utilizar o {company}, você concorda em <strong>não</strong>:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Usar a plataforma para fins ilegais ou não autorizados.</li>
                            <li>Enviar spam, mensagens em massa não solicitadas ou comunicações enganosas.</li>
                            <li>Violar direitos de privacidade de terceiros ou coletar dados sem consentimento.</li>
                            <li>Tentar acessar sistemas, dados ou contas de outros usuários sem autorização.</li>
                            <li>Realizar engenharia reversa, descompilar ou tentar extrair o código-fonte da plataforma.</li>
                            <li>Usar a plataforma para difundir conteúdo discriminatório, abusivo ou ilegal.</li>
                            <li>Sobrecarregar intencionalmente a infraestrutura da plataforma.</li>
                            <li>Revender, sublicenciar ou transferir o acesso à plataforma sem autorização expressa.</li>
                        </ul>
                        <p className="mt-3">
                            O {company} pode suspender ou encerrar contas que violem estas diretrizes, sem aviso
                            prévio e sem direito a reembolso.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">7. Propriedade Intelectual</h2>
                        <p>
                            A plataforma {company}, incluindo seu código-fonte, design, logotipos, textos e demais
                            conteúdos, é protegida por direitos autorais e outras leis de propriedade intelectual.
                            Nenhuma licença é concedida além do direito limitado de uso descrito nestes termos.
                        </p>
                        <p className="mt-3">
                            Os dados e conteúdos que você inserir na plataforma permanecem de sua propriedade.
                            Ao inserir dados, você concede ao {company} uma licença limitada para armazená-los e
                            processá-los exclusivamente para a prestação dos serviços contratados.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">8. Disponibilidade e SLA</h2>
                        <p>
                            Buscamos manter a plataforma disponível 24 horas por dia, 7 dias por semana, mas não
                            garantimos disponibilidade ininterrupta. Manutenções programadas serão comunicadas
                            com antecedência sempre que possível.
                        </p>
                        <p className="mt-3">
                            Não nos responsabilizamos por indisponibilidades causadas por fatores fora de nosso
                            controle, como falhas de internet, problemas em serviços de terceiros ou força maior.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">9. Limitação de Responsabilidade</h2>
                        <p>
                            Na máxima extensão permitida pela lei, o {company} não será responsável por danos
                            indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de
                            lucros, dados ou oportunidades de negócio, decorrentes do uso ou incapacidade de uso
                            da plataforma.
                        </p>
                        <p className="mt-3">
                            Nossa responsabilidade total por qualquer reclamação relacionada aos serviços não
                            excederá o valor pago pelo cliente nos 3 meses anteriores ao evento que originou
                            a reclamação.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">10. Indenização</h2>
                        <p>
                            Você concorda em indenizar e isentar o {company}, seus diretores, funcionários e
                            parceiros de quaisquer reclamações, danos, perdas ou despesas (incluindo honorários
                            advocatícios) decorrentes de: (i) seu uso da plataforma em violação destes termos;
                            (ii) violação de direitos de terceiros; ou (iii) uso indevido de dados de leads.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">11. Encerramento da Conta</h2>
                        <p>
                            Você pode encerrar sua conta a qualquer momento pelo painel da plataforma ou
                            entrando em contato conosco. Após o encerramento, seus dados serão excluídos ou
                            anonimizados em até 90 dias, conforme nossa Política de Privacidade, salvo quando
                            a retenção for exigida por lei.
                        </p>
                        <p className="mt-3">
                            O {company} pode encerrar ou suspender seu acesso imediatamente em caso de violação
                            destes termos, sem prejuízo de outras medidas cabíveis.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">12. Alterações nos Termos</h2>
                        <p>
                            Podemos atualizar estes Termos de Serviço periodicamente. Notificaremos sobre
                            alterações significativas por e-mail ou por aviso destacado na plataforma com
                            antecedência mínima de 15 dias. O uso continuado após a vigência das alterações
                            implica aceite dos novos termos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">13. Lei Aplicável e Foro</h2>
                        <p>
                            Estes termos são regidos pelas leis da República Federativa do Brasil. Quaisquer
                            disputas decorrentes destes termos serão submetidas ao foro da comarca de domicílio
                            do cliente, conforme o Código de Defesa do Consumidor, ou ao foro de São Paulo/SP
                            para relações entre empresas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">14. Contato</h2>
                        <p>
                            Em caso de dúvidas sobre estes Termos de Serviço, entre em contato conosco:
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
                        <Link href="/politica-de-privacidade" className="hover:text-foreground transition-colors">
                            Política de Privacidade
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    )
}
