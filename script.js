// Configuração - SUBSTITUA COM SUA URL DO APPS SCRIPT
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbUJWeeUgqidlyTJvGszLba4-VHZdVuo2dERFAGVFCJ6egc6TBNpVuE3jZ3mEX6t5k/exec';

// Array com todos os IDs dos itens (baseado na sua lista atualizada)
const itemIds = [
    // Avaliação Inicial
    'dtc_motor', 'dtc_transmissao', 'dtc_seguranca', 'dtc_carroceria',
    
    // Motor
    'condicao_bateria', 'alternador', 'terminal_bateria', 'vazamento_oleo',
    'velas_ignicao', 'bobinas_cabos', 'correia_dentada', 'correia_acessorios',
    'rolamentos_polias', 'tbi', 'condicao_nivel_oleo', 'filtro_ar_motor',
    
    // Arrefecimento
    'condicao_fluido_arref', 'vazamentos_arref', 'mangueiras_arref',
    'bomba_agua', 'radiador', 'tampa_arref', 'reservatorio', 'eletroventilador',
    
    // Freios
    'condicao_fluido_freio', 'flexiveis_freio', 'pastilhas_dianteira',
    'discos_dianteiro', 'tambor_disco_traseiro', 'pastilhas_sapata_traseira',
    'cilindro_roda', 'pincas', 'cabos_freio', 'modulo_abs',
    
    // Direção
    'condicao_fluido_direcao', 'bomba_hidraulica', 'caixa_direcao',
    'mangueiras_direcao', 'coluna', 'terminal_direcao', 'barra_axial',
    
    // Transmissão
    'condicao_fluido_transmissao', 'vazamentos_transmissao', 'diferencial_ruidos',
    'caixa_transferencia_ruidos', 'coifas_transmissao', 'homocinetica',
    'trizeta_tulipa', 'semi_eixos', 'coxim_diferencial', 'carda_folga_ruido',
    'rolamento_cubo_dianteiro', 'rolamento_cubo_traseiro', 'bolachao_carda',
    
    // Coxins
    'coxins_motor', 'coxins_cambio',
    
    // Suspensão Dianteira
    'bieletas_dianteira', 'buchas_bandeja_inf', 'buchas_bandeja_sup',
    'pivo_dianteiro', 'bucha_barra_estabilizadora', 'bucha_quadro_dianteira',
    'amortecedores_dianteiros', 'coxim_suspensao', 'rolamento_peso_dianteiro',
    'coifa_batente_dianteiro', 'mola_dianteira', 'calco_mola_dianteira',
    
    // Suspensão Traseira
    'bucha_manga_eixo', 'bucha_bandeja_inferior', 'bucha_bandeja_superior',
    'bucha_braco_tensor', 'braco_auxiliar_bucha_pivo', 'bucha_braco_oscilante',
    'calco_mola_traseira', 'batente_mola', 'mola_traseira',
    'coifa_batente_traseiro', 'coxim_amortecedor', 'amortecedor_traseiro',
    'bieleta_traseira', 'bucha_barra_estabilizadora_traseira', 'barra_estabilizadora_traseira',
    
    // Lâmpadas
    'farol_baixo', 'farol_alto', 'lanterna', 'neblina', 'pisca_dianteiro',
    'drl', 'freio_breaklight', 'lanterna_traseira', 'pisca_traseiro', 're', 'luz_placa',
    
    // Pneus
    'pneus_dianteiro', 'pneus_traseiro', 'estepe'
];

// Array com todos os IDs dos campos de texto
const textFieldIds = [
    'nomeCliente', 'telefones', 'email', 'cpf', 'placa', 'fabricante',
    'modelo', 'ano', 'motor', 'portas', 'combustivel', 'tanque',
    'km', 'direcao', 'ar', 'cor', 'dataEntrada', 'numOrdem'
];

// Objeto para armazenar o status de cada item
const statusData = {};

// Sistema de mensagens
function showMessage(text, isError = false) {
    const messageDiv = isError ? document.getElementById('error') : document.getElementById('message');
    const otherDiv = isError ? document.getElementById('message') : document.getElementById('error');
    
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    otherDiv.style.display = 'none';
    
    if (!isError) {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Sistema de progresso
function toggleProgressBar(show, progress = 0) {
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (show) {
        progressBar.style.display = 'block';
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    } else {
        progressBar.style.display = 'none';
    }
}

function updateProgressBar(progress) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
}

// Sistema de botões
function toggleButtons(disable) {
    const buttons = document.querySelectorAll('button');
    const checkboxes = document.querySelectorAll('.status-checkbox');
    const textFields = document.querySelectorAll('input[type="text"], input[type="date"]');
    
    buttons.forEach(button => {
        button.disabled = disable;
        button.style.opacity = disable ? '0.5' : '1';
        button.style.cursor = disable ? 'not-allowed' : 'pointer';
    });
    
    checkboxes.forEach(checkbox => {
        checkbox.style.pointerEvents = disable ? 'none' : 'auto';
        checkbox.style.opacity = disable ? '0.5' : '1';
    });
    
    textFields.forEach(field => {
        field.disabled = disable;
        field.style.opacity = disable ? '0.5' : '1';
        field.style.backgroundColor = disable ? '#f5f5f5' : 'white';
    });
}

// Modal de confirmação
function openModal() {
    document.getElementById('confirmModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

function confirmSave() {
    closeModal();
    saveToGoogleSheetConfirmed();
}

// Sistema de status
function updateCounters() {
    let okCount = 0, atencaoCount = 0, criticoCount = 0;
    
    itemIds.forEach(id => {
        const status = statusData[id];
        if (status === 'ok') okCount++;
        else if (status === 'atencao') atencaoCount++;
        else if (status === 'critico') criticoCount++;
    });
    
    document.getElementById('count-ok').textContent = okCount;
    document.getElementById('count-atencao').textContent = atencaoCount;
    document.getElementById('count-critico').textContent = criticoCount;
}

function selectStatus(checkbox) {
    if (document.querySelectorAll('button').length > 0 && document.querySelectorAll('button')[0].disabled) {
        return; // Não permite seleção se botões estão desabilitados
    }
    
    const itemId = checkbox.getAttribute('data-id');
    const status = checkbox.getAttribute('data-status');
    
    document.querySelectorAll(`.status-checkbox[data-id="${itemId}"]`).forEach(cb => {
        cb.classList.remove('checked');
    });
    
    checkbox.classList.add('checked');
    statusData[itemId] = status;
    updateCounters();
}

// Sistema de limpeza
function clearAllFields() {
    textFieldIds.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });

    itemIds.forEach(id => {
        statusData[id] = null;
        document.querySelectorAll(`.status-checkbox[data-id="${id}"]`).forEach(cb => {
            cb.classList.remove('checked');
        });
    });
    
    updateCounters();
}

// ==================== SISTEMA DE PDF AUTOMÁTICO ====================

async function generateComprovantePDF(dadosSalvos) {
    return new Promise((resolve) => {
        try {
            // Verificar se jsPDF está disponível
            if (typeof jsPDF === 'undefined') {
                console.error('Biblioteca jsPDF não carregada');
                // Tentar carregar dinamicamente
                loadJSPDF().then(() => {
                    createComprovantePDF(dadosSalvos).then(resolve);
                }).catch(() => {
                    // Fallback sem PDF
                    showComprovanteTela(dadosSalvos);
                    resolve();
                });
                return;
            }
            
            createComprovantePDF(dadosSalvos).then(resolve);
            
        } catch (error) {
            console.error('Erro ao iniciar geração de PDF:', error);
            showComprovanteTela(dadosSalvos);
            resolve();
        }
    });
}

async function loadJSPDF() {
    return new Promise((resolve, reject) => {
        if (typeof jsPDF !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
    });
}

// 1. FUNÇÃO AUXILIAR PARA CARREGAR A IMAGEM
// 1. FUNÇÃO AUXILIAR REVISADA
/**
 * Função auxiliar para carregar a imagem local
 */
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Importante para evitar problemas de CORS se rodar em servidor
        img.crossOrigin = "Anonymous"; 
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error("Não foi possível carregar a imagem em: " + url));
    });
}

/**
 * Função para formatar data (AAAA-MM-DD para DD/MM/AAAA)
 */
function formatarDataBR(dataString) {
    if (!dataString) return '-';
    const partes = dataString.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return dataString;
}

/**
 * Função principal de geração do PDF
 */
async function createComprovantePDF(dados, statusData) {
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        let yPos = 15;

        // 1. TENTATIVA DE CARREGAR LOGO LOCAL
        try {
            // Caminho para sua logo local
            const logoImg = await loadImage('logo.png');
            
            // Ajuste inteligente de tamanho (Mantendo proporção)
            const maxWidth = 50;
            const maxHeight = 25;
            let finalWidth = logoImg.width;
            let finalHeight = logoImg.height;
            const ratio = Math.min(maxWidth / finalWidth, maxHeight / finalHeight);
            
            finalWidth = finalWidth * ratio;
            finalHeight = finalHeight * ratio;

            // Adiciona a imagem centralizada
            pdf.addImage(logoImg, 'PNG', (pageWidth - finalWidth) / 2, 10, finalWidth, finalHeight);
            yPos = 15 + finalHeight + 10; // Posiciona o próximo texto abaixo da logo
        } catch (e) {
            console.warn("Logo não encontrada, prosseguindo sem ela.");
            yPos = 25;
        }

        // 2. DATA DE GERAÇÃO (Topo Direito)
        const dataGeracao = new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        pdf.setTextColor(100);
        pdf.setFontSize(8);
        pdf.text(`Gerado em: ${dataGeracao}`, pageWidth - 15, 12, { align: 'right' });

        // 3. SEÇÃO: INFORMAÇÕES DO CLIENTE / VEÍCULO
        pdf.setTextColor(0);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INFORMAÇÕES DO CLIENTE / VEÍCULO', 15, yPos);
        yPos += 2;
        pdf.setLineWidth(0.5);
        pdf.line(15, yPos, pageWidth - 15, yPos);
        yPos += 7;

        pdf.setFontSize(8.5);
        const col1 = 15, col2 = 80, col3 = 145;
        const dataEntradaFormatada = formatarDataBR(dados.dataEntrada);

        const campos = [
            { c1: ['Nome:', dados.nomeCliente], c2: ['Telefones:', dados.telefones], c3: ['Email:', dados.email] },
            { c1: ['CPF:', dados.cpf], c2: ['Placa:', dados.placa], c3: ['Fabricante:', dados.fabricante] },
            { c1: ['Modelo:', dados.modelo], c2: ['Ano:', dados.ano], c3: ['Motor:', dados.motor] },
            { c1: ['Portas:', dados.portas], c2: ['Combustível:', dados.combustivel], c3: ['Tanque:', dados.tanque] },
            { c1: ['KM:', dados.km], c2: ['Direção:', dados.direcao], c3: ['Ar:', dados.ar] },
            { c1: ['Cor:', dados.cor], c2: ['Data Entrada:', dataEntradaFormatada], c3: ['Nº Ordem:', dados.numOrdem] }
        ];

        campos.forEach(linha => {
            pdf.setFont('helvetica', 'bold'); 
            pdf.text(String(linha.c1[0]), col1, yPos);
            pdf.text(String(linha.c2[0]), col2, yPos);
            pdf.text(String(linha.c3[0]), col3, yPos);

            pdf.setFont('helvetica', 'normal'); 
            pdf.text(String(linha.c1[1] || '-'), col1 + 14, yPos);
            pdf.text(String(linha.c2[1] || '-'), col2 + 20, yPos);
            pdf.text(String(linha.c3[1] || '-'), col3 + 18, yPos);
            yPos += 5;
        });

        yPos += 5;

        // 4. ITENS INSPECIONADOS
        const categorias = {
            "AVALIAÇÃO INICIAL": ['dtc_motor', 'dtc_transmissao', 'dtc_seguranca', 'dtc_carroceria'],
            "MOTOR": ['condicao_bateria', 'alternador', 'terminal_bateria', 'vazamento_oleo', 'velas_ignicao', 'bobinas_cabos', 'correia_dentada', 'correia_acessorios', 'rolamentos_polias', 'tbi', 'condicao_nivel_oleo', 'filtro_ar_motor'],
            "ARREFECIMENTO": ['condicao_fluido_arref', 'vazamentos_arref', 'mangueiras_arref', 'bomba_agua', 'radiador', 'tampa_arref', 'reservatorio', 'eletroventilador'],
            "FREIOS": ['condicao_fluido_freio', 'flexiveis_freio', 'pastilhas_dianteira', 'discos_dianteiro', 'tambor_disco_traseiro', 'pastilhas_sapata_traseira', 'cilindro_roda', 'pincas', 'cabos_freio', 'modulo_abs'],
            "DIREÇÃO": ['condicao_fluido_direcao', 'bomba_hidraulica', 'caixa_direcao', 'mangueiras_direcao', 'coluna', 'terminal_direcao', 'barra_axial'],
            "TRANSMISSÃO": ['condicao_fluido_transmissao', 'vazamentos_transmissao', 'diferencial_ruidos', 'caixa_transferencia_ruidos', 'coifas_transmissao', 'homocinetica', 'trizeta_tulipa', 'semi_eixos', 'coxim_diferencial', 'carda_folga_ruido', 'rolamento_cubo_dianteiro', 'rolamento_cubo_traseiro', 'bolachao_carda'],
            "COXINS": ['coxins_motor', 'coxins_cambio'],
            "SUSPENSÃO DIANTEIRA": ['bieletas_dianteira', 'buchas_bandeja_inf', 'buchas_bandeja_sup', 'pivo_dianteiro', 'bucha_barra_estabilizadora', 'bucha_quadro_dianteira', 'amortecedores_dianteiros', 'coxim_suspensao', 'rolamento_peso_dianteiro', 'coifa_batente_dianteiro', 'mola_dianteira', 'calco_mola_dianteira'],
            "SUSPENSÃO TRASEIRA": ['bucha_manga_eixo', 'bucha_bandeja_inferior', 'bucha_bandeja_superior', 'bucha_braco_tensor', 'braco_auxiliar_bucha_pivo', 'bucha_braco_oscilante', 'calco_mola_traseira', 'batente_mola', 'mola_traseira', 'coifa_batente_traseiro', 'coxim_amortecedor', 'amortecedor_traseiro', 'bieleta_traseira', 'bucha_barra_estabilizadora_traseira', 'barra_estabilizadora_traseira'],
            "LÂMPADAS": ['farol_baixo', 'farol_alto', 'lanterna', 'neblina', 'pisca_dianteiro', 'drl', 'freio_breaklight', 'lanterna_traseira', 'pisca_traseiro', 're', 'luz_placa'],
            "PNEUS": ['pneus_dianteiro', 'pneus_traseiro', 'estepe']
        };

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DETALHAMENTO DA INSPEÇÃO', 15, yPos);
        yPos += 2;
        pdf.line(15, yPos, pageWidth - 15, yPos);
        yPos += 6;

        pdf.setFontSize(7.5);
        for (const [titulo, ids] of Object.entries(categorias)) {
            // Verificação de quebra de página
            if (yPos > 270) { pdf.addPage(); yPos = 20; }
            
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 150, 136); 
            pdf.text(titulo, 15, yPos);
            yPos += 4.5;
            
            pdf.setTextColor(0);
            pdf.setFont('helvetica', 'normal');

            ids.forEach((id, index) => {
                if (yPos > 282) { pdf.addPage(); yPos = 20; }
                
                let currentX = (index % 2 === 0) ? 20 : 110;
                const status = statusData ? statusData[id] : null;
                let prefixo = '[ - ]';
                
                if (status === 'ok') { pdf.setTextColor(46, 204, 113); prefixo = '[ OK ]'; }
                else if (status === 'atencao') { pdf.setTextColor(211, 158, 0); prefixo = '[ ! ]'; }
                else if (status === 'critico') { pdf.setTextColor(231, 76, 60); prefixo = '[ X ]'; }
                else { pdf.setTextColor(150); }

                const nomeFormatado = id.replace(/_/g, ' ').toUpperCase();
                pdf.text(`${prefixo} ${nomeFormatado}`, currentX, yPos);
                
                if (index % 2 !== 0 || index === ids.length - 1) yPos += 4.5;
            });
            yPos += 2;
        }

        // 5. ASSINATURA
        yPos += 10;
        if (yPos > 270) { pdf.addPage(); yPos = 30; }
        pdf.setDrawColor(200);
        pdf.setTextColor(0);
        pdf.line(60, yPos + 10, pageWidth - 60, yPos + 10);
        pdf.setFontSize(8);
        pdf.text('Assinatura do Responsável Técnico', pageWidth / 2, yPos + 14, { align: 'center' });

        // SALVAMENTO
        pdf.save(`Checklist_${dados.placa || 'Veiculo'}.pdf`);
        if (typeof showComprovanteSuccess === "function") showComprovanteSuccess();

    } catch (error) {
        console.error("Erro geral na geração do PDF:", error);
    }
}



function showComprovanteTela(dados) {
    // Criar uma tela de comprovante HTML (fallback)
    const comprovanteDiv = document.createElement('div');
    comprovanteDiv.id = 'comprovante-tela';
    comprovanteDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 9999;
        padding: 20px;
        overflow-y: auto;
        font-family: Arial, sans-serif;
    `;
    
    const dataFormatada = new Date().toLocaleString('pt-BR');
    const transactionId = 'CHK-' + Date.now().toString().slice(-8);
    
    comprovanteDiv.innerHTML = `
        <div style="background: #009688; color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0;">✓ CHECKLIST VEICULAR</h1>
            <p style="margin: 5px 0 0 0;">COMPROVANTE DE INSPEÇÃO</p>
        </div>
        
        <div style="text-align: right; color: #666; font-size: 12px; margin-bottom: 20px;">
            ID: ${transactionId}<br>
            ${dataFormatada}
        </div>
        
        <div style="text-align: center; color: #009688; font-weight: bold; font-size: 16px; margin: 20px 0;">
            ✓ INSPEÇÃO REGISTRADA COM SUCESSO
        </div>
        
        <div style="border-top: 2px solid #ccc; padding-top: 20px; margin: 20px 0;">
            <h3 style="text-align: center;">DADOS DO CLIENTE</h3>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin: 20px;">
                <div><strong>CLIENTE:</strong></div>
                <div>${dados.nomeCliente || 'Não informado'}</div>
                
                <div><strong>PLACA:</strong></div>
                <div>${dados.placa || 'Não informada'}</div>
                
                <div><strong>VEÍCULO:</strong></div>
                <div>${dados.fabricante || ''} ${dados.modelo || ''} ${dados.ano || ''}</div>
                
                <div><strong>DATA ENTRADA:</strong></div>
                <div>${dados.dataEntrada || new Date().toLocaleDateString('pt-BR')}</div>
                
                <div><strong>ORDEM SERVIÇO:</strong></div>
                <div>${dados.numOrdem || 'Não informado'}</div>
            </div>
        </div>
        
        <div style="border-top: 2px solid #ccc; padding-top: 20px; margin: 20px 0;">
            <h3 style="text-align: center;">RESUMO DA AVALIAÇÃO</h3>
            <div style="display: flex; justify-content: center; gap: 20px; margin: 30px 0;">
                <div style="background: #2ecc71; color: white; padding: 15px; border-radius: 8px; text-align: center; min-width: 100px;">
                    <div style="font-size: 24px;">✓</div>
                    <div style="font-weight: bold;">CONFORME</div>
                    <div>${dados.total_ok || 0} itens</div>
                </div>
                
                <div style="background: #f1c40f; color: white; padding: 15px; border-radius: 8px; text-align: center; min-width: 100px;">
                    <div style="font-size: 24px;">⚠</div>
                    <div style="font-weight: bold;">ATENÇÃO</div>
                    <div>${dados.total_atencao || 0} itens</div>
                </div>
                
                <div style="background: #e74c3c; color: white; padding: 15px; border-radius: 8px; text-align: center; min-width: 100px;">
                    <div style="font-size: 24px;">✗</div>
                    <div style="font-weight: bold;">CRÍTICO</div>
                    <div>${dados.total_critico || 0} itens</div>
                </div>
            </div>
        </div>
        
        ${parseInt(dados.total_critico) > 0 ? `
        <div style="border: 2px solid #e74c3c; padding: 15px; border-radius: 8px; margin: 20px 0; background: #ffebee;">
            <h4 style="color: #e74c3c; margin-top: 0;">⚠ ATENÇÃO: ITENS CRÍTICOS DETECTADOS</h4>
            <ul style="margin: 10px 0;">
                ${(() => {
                    let items = '';
                    let count = 0;
                    itemIds.forEach(id => {
                        const status = dados[id];
                        if (status && status.includes('🔴') && count < 5) {
                            const label = id.replace(/_/g, ' ').toUpperCase();
                            items += `<li>${label}</li>`;
                            count++;
                        }
                    });
                    return items;
                })()}
            </ul>
        </div>
        ` : ''}
        
        <div style="border-top: 1px solid #ccc; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
            <p><em>Este comprovante serve como registro oficial da inspeção realizada.</em></p>
            <p><em>Recomenda-se a correção dos itens críticos e de atenção identificados.</em></p>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <button onclick="imprimirComprovante()" style="background: #2196F3; color: white; border: none; padding: 12px 30px; border-radius: 4px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                🖨️ Imprimir
            </button>
            <button onclick="fecharComprovante()" style="background: #666; color: white; border: none; padding: 12px 30px; border-radius: 4px; font-size: 16px; cursor: pointer;">
                ✕ Fechar
            </button>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 11px; color: #999;">
            <p>Checklist Veicular • Sistema de Inspeção Automotiva</p>
            <p>Comprovante válido como registro técnico</p>
        </div>
    `;
    
    document.body.appendChild(comprovanteDiv);
    
    // Adicionar as funções ao escopo global temporariamente
    window.imprimirComprovante = function() {
        const comprovanteContent = comprovanteDiv.innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Comprovante de Inspeção</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        @media print {
                            button { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    ${comprovanteContent.replace(/<button[\s\S]*?<\/button>/g, '')}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };
    
    window.fecharComprovante = function() {
        document.body.removeChild(comprovanteDiv);
        delete window.imprimirComprovante;
        delete window.fecharComprovante;
        // Limpar formulário após fechar o comprovante
        setTimeout(() => {
            clearAllFields();
            showMessage('Formulário limpo automaticamente. Pronto para novo checklist!');
        }, 500);
    };
}

function showComprovanteSuccess() {
    // Mostrar mensagem de sucesso
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    successDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">✓</span>
            <div>
                <div style="font-weight: bold;">PDF gerado com sucesso!</div>
                <div style="font-size: 12px;">Verifique sua pasta de downloads</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    document.body.removeChild(successDiv);
                }
            }, 300);
        }
    }, 5000);
    
    // Adicionar estilos de animação
    if (!document.querySelector('#comprovante-styles')) {
        const style = document.createElement('style');
        style.id = 'comprovante-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==================== SISTEMA DE SALVAMENTO ====================

// Sistema de salvamento no Google Sheets
async function saveToGoogleSheet() {
    openModal();
}

async function saveToGoogleSheetConfirmed() {
    try {
        toggleProgressBar(true, 10);
        toggleButtons(true);
        showMessage('Preparando dados para salvar...', false);
        
        // Preparar dados do cliente
        updateProgressBar(20);
        const clientData = {};
        textFieldIds.forEach(fieldId => {
            clientData[fieldId] = document.getElementById(fieldId).value;
        });

        // Preparar dados do checklist
        updateProgressBar(40);
        const checklistData = {};
        itemIds.forEach(id => {
            const status = statusData[id];
            if (status === 'ok') checklistData[id] = '🟢 OK';
            else if (status === 'atencao') checklistData[id] = '🟡 ATENÇÃO';
            else if (status === 'critico') checklistData[id] = '🔴 CRÍTICO';
            else checklistData[id] = 'NÃO AVALIADO';
        });

        // Combinar todos os dados
        updateProgressBar(60);
        const allData = {
            ...clientData,
            ...checklistData,
            timestamp: new Date().toLocaleString('pt-BR'),
            total_ok: document.getElementById('count-ok').textContent,
            total_atencao: document.getElementById('count-atencao').textContent,
            total_critico: document.getElementById('count-critico').textContent
        };
        
        showMessage('Enviando dados para o servidor...', false);
        updateProgressBar(80);
        
        // Enviar para Google Sheets
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(allData)
        });
        
        updateProgressBar(100);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toggleProgressBar(false);
        
        showMessage('✓ Dados salvos com sucesso! Gerando comprovante...');
        
        // Reativar botões
        toggleButtons(false);
        
        // GERAR PDF AUTOMATICAMENTE (como app de banco)
        setTimeout(() => {
            generateComprovantePDF(allData).then(() => {
                // Limpar formulário automaticamente após 3 segundos do PDF gerado
                setTimeout(() => {
                    clearAllFields();
                    showMessage('Formulário limpo automaticamente. Pronto para novo checklist!');
                }, 3000);
            });
        }, 500);
        
    } catch (error) {
        console.error('Erro:', error);
        toggleProgressBar(false);
        toggleButtons(false);
        showMessage('Erro ao salvar dados. Verifique a conexão.', true);
    }
}

// Limpar formulário
function clearForm() {
    // Verificar se algum botão está desabilitado
    const anyButtonDisabled = Array.from(document.querySelectorAll('button')).some(btn => btn.disabled);
    
    if (anyButtonDisabled) {
        showMessage('Aguarde o término da operação atual.', true);
        return;
    }
    
    if (confirm('Deseja realmente limpar todo o formulário? Os dados não salvos serão perdidos.')) {
        clearAllFields();
        showMessage('Formulário limpo com sucesso!');
    }
}

// ==================== INICIALIZAÇÃO ====================

// Inicialização - Barra de Progresso
function createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.id = 'progress-bar';
    progressContainer.className = 'progress-container';
    progressContainer.style.cssText = `
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 1000;
        text-align: center;
        min-width: 300px;
    `;
    
    progressContainer.innerHTML = `
        <div style="color: #333; margin-bottom: 15px; font-size: 18px;">Salvando dados...</div>
        <div style="width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; margin: 20px 0; overflow: hidden;">
            <div id="progress-fill" style="height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 10px; transition: width 0.3s ease; width: 0%;"></div>
        </div>
        <div id="progress-text" style="font-weight: bold; color: #333; margin-top: 10px;">0%</div>
    `;
    
    document.body.appendChild(progressContainer);
}

// Inicialização da página
window.addEventListener('DOMContentLoaded', () => {
    // Inicializar statusData
    itemIds.forEach(id => {
        statusData[id] = null;
    });
    
    // Criar barra de progresso
    createProgressBar();
    
    // Adicionar event listeners aos checkboxes
    document.querySelectorAll('.status-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', () => selectStatus(checkbox));
    });
    
    // Atualizar contadores inicialmente
    updateCounters();
    
    showMessage('Formulário pronto para uso. Selecione o status para cada item.');
});

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    // Verificar se algum botão está desabilitado
    const anyButtonDisabled = Array.from(document.querySelectorAll('button')).some(btn => btn.disabled);
    if (anyButtonDisabled) return;
    
    // Ctrl + S para salvar
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToGoogleSheet();
    }
    // Ctrl + D para limpar
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        clearForm();
    }
});

// Aviso ao sair da página se houver dados não salvos
window.addEventListener('beforeunload', (e) => {
    // Verificar se algum botão está desabilitado (salvamento em andamento)
    const anyButtonDisabled = Array.from(document.querySelectorAll('button')).some(btn => btn.disabled);
    if (anyButtonDisabled) return;
    
    // Verificar se há dados no formulário
    const hasData = textFieldIds.some(fieldId => 
        document.getElementById(fieldId).value.trim() !== ''
    ) || itemIds.some(id => statusData[id]);
    
    if (hasData) {
        e.preventDefault();
        e.returnValue = 'Existem dados não salvos no formulário. Tem certeza que deseja sair?';
        return e.returnValue;
    }
});

// Função para imprimir (opcional)
function printForm() {
    window.print();
}

// Adicionar timeout de segurança
setTimeout(() => {
    const anyButtonDisabled = Array.from(document.querySelectorAll('button')).some(btn => btn.disabled);
    const progressBarVisible = document.getElementById('progress-bar')?.style.display === 'block';
    
    if (anyButtonDisabled && progressBarVisible) {
        console.log('Safety timeout: Reativando interface...');
        toggleProgressBar(false);
        toggleButtons(false);
        showMessage('Interface reativada automaticamente.', false);
    }
}, 30000);