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

// Variável para controle de salvamento
let isSaving = false;
// Variável para armazenar os dados enviados (para uso no PDF)
let lastSavedData = null;

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

// Função para mostrar/esconder barra de progresso
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

// Função para atualizar a barra de progresso
function updateProgressBar(progress) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
}

// Função para congelar/descongelar botões
function toggleButtons(disable) {
    const buttons = document.querySelectorAll('.button-container button, .btn-pdf, .btn-print, .btn-save, .btn-clear');
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
    
    isSaving = disable;
}

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

// Função para atualizar contadores
function updateCounters() {
    let okCount = 0;
    let atencaoCount = 0;
    let criticoCount = 0;
    
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

// Função para selecionar status
function selectStatus(checkbox) {
    if (isSaving) return; // Impede seleção durante salvamento
    
    const itemId = checkbox.getAttribute('data-id');
    const status = checkbox.getAttribute('data-status');
    
    // Encontrar todos os checkboxes do mesmo item
    const allCheckboxes = document.querySelectorAll(`.status-checkbox[data-id="${itemId}"]`);
    
    // Remover seleção de todos os checkboxes deste item
    allCheckboxes.forEach(cb => {
        cb.classList.remove('checked');
    });
    
    // Selecionar o checkbox clicado
    checkbox.classList.add('checked');
    
    // Salvar status no objeto
    statusData[itemId] = status;
    
    // Atualizar contadores
    updateCounters();
}

// Função para limpar todos os campos do formulário
function clearAllFields() {
    // Limpar campos de texto
    textFieldIds.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if (field.type === 'date') {
                field.value = '';
            } else {
                field.value = '';
            }
        }
    });

    // Limpar status dos itens
    itemIds.forEach(id => {
        statusData[id] = null;
        const checkboxes = document.querySelectorAll(`.status-checkbox[data-id="${id}"]`);
        checkboxes.forEach(cb => {
            cb.classList.remove('checked');
        });
    });
    
    // Resetar contadores
    updateCounters();
    
    // Remover botão de compartilhar se existir
    const shareButton = document.getElementById('btn-share-pdf');
    if (shareButton) {
        shareButton.remove();
    }
    
    lastSavedData = null;
}

// Função para preparar a página para captura (remove elementos problemáticos)
function preparePageForCapture() {
    const page = document.querySelector('.page');
    const clone = page.cloneNode(true);
    
    // Remover elementos problemáticos
    clone.querySelectorAll('img, iframe, video, audio, canvas').forEach(el => el.remove());
    
    // Remover elementos de interação
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    
    // Remover event listeners
    clone.querySelectorAll('*').forEach(el => {
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
    });
    
    // Estilo para a cópia
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = '210mm';
    clone.style.backgroundColor = 'white';
    clone.style.color = 'black';
    
    document.body.appendChild(clone);
    
    return clone;
}

// Função para limpar a cópia após a captura
function cleanupCaptureClone(clone) {
    if (clone && clone.parentNode) {
        clone.parentNode.removeChild(clone);
    }
}

// Função para gerar PDF após salvamento
async function generateAndSharePDF() {
    try {
        if (!lastSavedData) {
            showMessage('Nenhum dado encontrado para gerar PDF', true);
            return;
        }
        
        showMessage('Gerando PDF para compartilhamento...', false);
        toggleButtons(true);
        
        // Criar uma cópia limpa da página para captura
        const pageClone = preparePageForCapture();
        
        try {
            // Capturar a página com html2canvas - CONFIGURAÇÕES CORRIGIDAS
            const canvas = await html2canvas(pageClone, {
                scale: 2,
                useCORS: false, // IMPORTANTE: false para evitar problemas de CORS
                allowTaint: false, // IMPORTANTE: false para evitar tainted canvas
                backgroundColor: '#ffffff',
                logging: false,
                imageTimeout: 0, // Desabilita timeout para imagens
                removeContainer: true,
                foreignObjectRendering: false, // Desabilita foreignObject
                ignoreElements: (element) => {
                    // Ignora elementos específicos que podem causar problemas
                    return element.tagName === 'IMG' || 
                           element.tagName === 'IFRAME' ||
                           element.tagName === 'VIDEO' ||
                           element.tagName === 'AUDIO' ||
                           element.tagName === 'CANVAS';
                }
            });
            
            // Limpar a cópia
            cleanupCaptureClone(pageClone);
            
            // Configurar o PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190; // Largura menor para margens
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Calcular posição para centralizar
            const xPos = (210 - imgWidth) / 2; // 210mm é largura do A4
            
            // Adicionar título ao PDF
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text('CHECKLIST VEICULAR - INSPEÇÃO COMPLETA', 105, 15, { align: 'center' });
            
            // Adicionar informações do cliente
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Cliente: ${lastSavedData.nomeCliente || 'Não informado'}`, 20, 25);
            pdf.text(`Placa: ${lastSavedData.placa || 'Não informada'}`, 20, 30);
            pdf.text(`Data: ${lastSavedData.dataEntrada || new Date().toLocaleDateString('pt-BR')}`, 20, 35);
            
            // Adicionar resumo
            pdf.text(`Resumo: OK: ${lastSavedData.total_ok || 0} | ATENÇÃO: ${lastSavedData.total_atencao || 0} | CRÍTICO: ${lastSavedData.total_critico || 0}`, 20, 40);
            
            // Adicionar a imagem ao PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95); // Usar JPEG para menor tamanho
            pdf.addImage(imgData, 'JPEG', xPos, 45, imgWidth, imgHeight);
            
            // Adicionar rodapé
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.setFontSize(8);
            pdf.setTextColor(100);
            pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 10, { align: 'center' });
            pdf.text(`Checklist Veicular - Todos os direitos reservados`, 105, pageHeight - 5, { align: 'center' });
            
            // Gerar nome do arquivo
            const nomeCliente = (lastSavedData.nomeCliente || 'Checklist')
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9_]/g, '');
            const placa = (lastSavedData.placa || '')
                .replace(/\s+/g, '')
                .toUpperCase();
            const data = new Date().toISOString().split('T')[0];
            const fileName = `Checklist_${nomeCliente}_${placa}_${data}.pdf`;
            
            // Salvar o PDF
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            // Abrir em nova aba para visualização
            const newWindow = window.open(pdfUrl, '_blank');
            if (!newWindow) {
                // Se popup foi bloqueado, oferecer download
                downloadPDF(pdfBlob, fileName);
            }
            
            // Mostrar opções de compartilhamento
            setTimeout(() => {
                showShareOptions(pdfBlob, fileName);
                toggleButtons(false);
                showMessage('✓ PDF gerado com sucesso! Clique em "COMPARTILHAR PDF" acima.');
            }, 1000);
            
        } catch (captureError) {
            console.error('Erro na captura:', captureError);
            cleanupCaptureClone(pageClone);
            
            // Fallback: criar PDF apenas com texto
            createTextOnlyPDF();
        }
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        toggleButtons(false);
        showMessage('Erro ao gerar PDF. Tentando método alternativo...', true);
        
        // Tentar método alternativo
        setTimeout(() => {
            createTextOnlyPDF();
        }, 1000);
    }
}

// Método alternativo: criar PDF apenas com texto
function createTextOnlyPDF() {
    try {
        if (!lastSavedData) return;
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Configurações do PDF
        pdf.setFont('helvetica');
        
        // Cabeçalho
        pdf.setFontSize(20);
        pdf.setTextColor(0, 0, 0);
        pdf.text('CHECKLIST VEICULAR', 105, 20, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.text('INSPEÇÃO COMPLETA DE VEÍCULO', 105, 28, { align: 'center' });
        
        // Informações do cliente
        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        
        let yPos = 40;
        
        // Linha divisória
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPos - 5, 190, yPos - 5);
        
        // Informações do cliente
        pdf.setFont('helvetica', 'bold');
        pdf.text('INFORMAÇÕES DO CLIENTE E VEÍCULO:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        
        yPos += 7;
        pdf.text(`Cliente: ${lastSavedData.nomeCliente || 'Não informado'}`, 20, yPos);
        yPos += 5;
        pdf.text(`Telefone: ${lastSavedData.telefones || 'Não informado'}`, 20, yPos);
        yPos += 5;
        pdf.text(`Email: ${lastSavedData.email || 'Não informado'}`, 20, yPos);
        yPos += 5;
        pdf.text(`CPF: ${lastSavedData.cpf || 'Não informado'}`, 20, yPos);
        yPos += 5;
        pdf.text(`Placa: ${lastSavedData.placa || 'Não informada'}`, 20, yPos);
        yPos += 5;
        pdf.text(`Modelo: ${lastSavedData.fabricante || ''} ${lastSavedData.modelo || ''} ${lastSavedData.ano || ''}`, 20, yPos);
        yPos += 5;
        pdf.text(`Motor: ${lastSavedData.motor || 'Não informado'} | Combustível: ${lastSavedData.combustivel || 'Não informado'}`, 20, yPos);
        yPos += 5;
        pdf.text(`KM: ${lastSavedData.km || 'Não informado'} | Direção: ${lastSavedData.direcao || 'Não informado'}`, 20, yPos);
        
        yPos += 10;
        
        // Resumo
        pdf.setFont('helvetica', 'bold');
        pdf.text('RESUMO DA INSPEÇÃO:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        
        yPos += 7;
        pdf.setTextColor(0, 128, 0);
        pdf.text(`✓ OK: ${lastSavedData.total_ok || 0} itens`, 20, yPos);
        pdf.setTextColor(255, 165, 0);
        pdf.text(`⚠ ATENÇÃO: ${lastSavedData.total_atencao || 0} itens`, 80, yPos);
        pdf.setTextColor(255, 0, 0);
        pdf.text(`✗ CRÍTICO: ${lastSavedData.total_critico || 0} itens`, 140, yPos);
        
        pdf.setTextColor(0, 0, 0);
        yPos += 10;
        
        // Detalhes por categoria
        const categories = [
            { title: 'AVALIAÇÃO INICIAL', items: ['dtc_motor', 'dtc_transmissao', 'dtc_seguranca', 'dtc_carroceria'] },
            { title: 'MOTOR', items: ['condicao_bateria', 'alternador', 'terminal_bateria', 'vazamento_oleo', 'velas_ignicao'] },
            // Adicione outras categorias conforme necessário
        ];
        
        categories.forEach(category => {
            if (yPos > 250) {
                pdf.addPage();
                yPos = 20;
            }
            
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${category.title}:`, 20, yPos);
            pdf.setFont('helvetica', 'normal');
            yPos += 5;
            
            category.items.forEach(itemId => {
                if (lastSavedData[itemId] && lastSavedData[itemId] !== 'NÃO AVALIADO') {
                    const itemName = itemId.replace(/_/g, ' ').toUpperCase();
                    pdf.text(`  ${lastSavedData[itemId]} ${itemName}`, 25, yPos);
                    yPos += 4;
                }
            });
            
            yPos += 5;
        });
        
        // Rodapé
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 10, { align: 'center' });
        pdf.text(`Checklist Veicular - Relatório Técnico`, 105, pageHeight - 5, { align: 'center' });
        
        // Gerar nome do arquivo
        const nomeCliente = (lastSavedData.nomeCliente || 'Checklist')
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '');
        const placa = (lastSavedData.placa || '')
            .replace(/\s+/g, '')
            .toUpperCase();
        const data = new Date().toISOString().split('T')[0];
        const fileName = `Checklist_${nomeCliente}_${placa}_${data}.pdf`;
        
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        window.open(pdfUrl, '_blank');
        showShareOptions(pdfBlob, fileName);
        toggleButtons(false);
        
        showMessage('✓ PDF gerado com sucesso (método alternativo)!');
        
    } catch (error) {
        console.error('Erro no método alternativo:', error);
        toggleButtons(false);
        showMessage('❌ Erro ao gerar PDF. Tente usar a opção de impressão do navegador.', true);
    }
}

// Função para mostrar opções de compartilhamento
function showShareOptions(pdfBlob, fileName) {
    // Criar botão de compartilhar se não existir
    let shareButton = document.getElementById('btn-share-pdf');
    
    if (!shareButton) {
        shareButton = document.createElement('button');
        shareButton.id = 'btn-share-pdf';
        shareButton.className = 'btn-share';
        shareButton.innerHTML = '📤 COMPARTILHAR PDF';
        
        // Adicionar estilo para o botão de compartilhar
        const style = document.createElement('style');
        if (!document.querySelector('#share-button-styles')) {
            style.id = 'share-button-styles';
            style.textContent = `
                .btn-share {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    padding: 12px 30px !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 4px !important;
                    cursor: pointer !important;
                    font-weight: bold !important;
                    font-size: 14px !important;
                    width: 100% !important;
                    max-width: 300px !important;
                    margin-bottom: 10px !important;
                    animation: pulse 2s infinite;
                }
                .btn-share:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4) !important;
                    transition: all 0.3s ease !important;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Adicionar ao container de botões
        const buttonContainer = document.querySelector('.button-container');
        if (buttonContainer) {
            buttonContainer.insertBefore(shareButton, buttonContainer.firstChild);
        }
    }
    
    // Atualizar funcionalidade do botão
    shareButton.onclick = async () => {
        try {
            // Verificar se a Web Share API está disponível
            if (navigator.share) {
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                
                try {
                    await navigator.share({
                        files: [file],
                        title: `Checklist Veicular - ${lastSavedData.nomeCliente || 'Cliente'}`,
                        text: `Checklist completo do veículo ${lastSavedData.placa || ''}. Cliente: ${lastSavedData.nomeCliente || ''}`
                    });
                    showMessage('✓ PDF compartilhado com sucesso!');
                } catch (shareError) {
                    // Se não conseguir compartilhar arquivos, oferecer download
                    downloadPDF(pdfBlob, fileName);
                }
            } else {
                // Fallback para download
                downloadPDF(pdfBlob, fileName);
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            downloadPDF(pdfBlob, fileName);
        }
    };
}

// Função auxiliar para download do PDF
function downloadPDF(pdfBlob, fileName) {
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(pdfBlob);
    downloadLink.download = fileName;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showMessage('✓ PDF baixado com sucesso! Verifique sua pasta de downloads.');
}

async function saveToGoogleSheet() {
    openModal();
}

async function saveToGoogleSheetConfirmed() {
    try {
        // Mostrar barra de progresso inicial
        toggleProgressBar(true, 10);
        toggleButtons(true);
        showMessage('Preparando dados para salvar...', false);
        
        // Fase 1: Preparação dos dados (20%)
        await new Promise(resolve => {
            setTimeout(() => {
                updateProgressBar(20);
                resolve();
            }, 300);
        });
        
        // Coletar dados do cliente
        const clientData = {};
        textFieldIds.forEach(fieldId => {
            clientData[fieldId] = document.getElementById(fieldId).value;
        });

        // Fase 2: Coleta de status (40%)
        updateProgressBar(40);
        await new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 300);
        });
        
        // Coletar status dos itens
        const checklistData = {};
        itemIds.forEach(id => {
            const status = statusData[id];
            if (status === 'ok') {
                checklistData[id] = '🟢 OK';
            } else if (status === 'atencao') {
                checklistData[id] = '🟡 ATENÇÃO';
            } else if (status === 'critico') {
                checklistData[id] = '🔴 CRÍTICO';
            } else {
                checklistData[id] = 'NÃO AVALIADO';
            }
        });

        // Fase 3: Combinação dos dados (60%)
        updateProgressBar(60);
        await new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 300);
        });
        
        // Combinar todos os dados
        const allData = {
            ...clientData,
            ...checklistData,
            timestamp: new Date().toLocaleString('pt-BR'),
            total_ok: document.getElementById('count-ok').textContent,
            total_atencao: document.getElementById('count-atencao').textContent,
            total_critico: document.getElementById('count-critico').textContent
        };

        // Salvar dados para uso posterior no PDF
        lastSavedData = { ...allData };
        
        showMessage('Enviando dados para o servidor...', false);
        
        // Fase 4: Envio para Google Sheets (80%)
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
        
        // Fase 5: Finalização (100%)
        updateProgressBar(100);
        await new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 500);
        });
        
        // Esconder barra de progresso
        toggleProgressBar(false);
        
        // Mostrar mensagem de sucesso
        showMessage('✓ Dados salvos com sucesso! Gerando PDF...');
        
        // Gerar e mostrar PDF automaticamente após salvamento
        setTimeout(() => {
            generateAndSharePDF();
            
            // Aguardar mais 3 segundos antes de limpar
            setTimeout(() => {
                showMessage('Formulário será limpo em 5 segundos...');
                
                // Limpar após mais 5 segundos
                setTimeout(() => {
                    clearAllFields();
                    showMessage('Formulário limpo. Pronto para novo checklist!');
                }, 5000);
            }, 3000);
        }, 1000);

    } catch (error) {
        console.error('Erro:', error);
        
        // Em caso de erro, reativar botões e esconder progresso
        toggleProgressBar(false);
        toggleButtons(false);
        showMessage('Erro ao salvar dados. Verifique a conexão.', true);
    }
}

// FUNÇÃO PARA SALVAR COMO PDF (manual)
async function saveAsPDF() {
    if (isSaving) return;
    
    try {
        // Capturar dados atuais para o PDF
        const clientData = {};
        textFieldIds.forEach(fieldId => {
            clientData[fieldId] = document.getElementById(fieldId).value;
        });
        
        // Adicionar status atuais
        const checklistData = {};
        itemIds.forEach(id => {
            const status = statusData[id];
            if (status === 'ok') {
                checklistData[id] = '🟢 OK';
            } else if (status === 'atencao') {
                checklistData[id] = '🟡 ATENÇÃO';
            } else if (status === 'critico') {
                checklistData[id] = '🔴 CRÍTICO';
            } else {
                checklistData[id] = 'NÃO AVALIADO';
            }
        });
        
        lastSavedData = {
            ...clientData,
            ...checklistData,
            total_ok: document.getElementById('count-ok').textContent,
            total_atencao: document.getElementById('count-atencao').textContent,
            total_critico: document.getElementById('count-critico').textContent,
            dataEntrada: new Date().toLocaleDateString('pt-BR')
        };
        
        // Gerar o PDF
        await generateAndSharePDF();
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showMessage('Erro ao gerar PDF. Tente novamente.', true);
    }
}

// Adicionar botão de salvar como PDF
function addPDFButton() {
    const buttonContainer = document.querySelector('.button-container');
    if (buttonContainer) {
        // Criar botão de PDF
        const pdfButton = document.createElement('button');
        pdfButton.className = 'btn-pdf';
        pdfButton.innerHTML = '📄 SALVAR COMO PDF';
        pdfButton.onclick = saveAsPDF;
        
        // Adicionar estilo para o botão PDF
        const style = document.createElement('style');
        if (!document.querySelector('#pdf-button-styles')) {
            style.id = 'pdf-button-styles';
            style.textContent = `
                .btn-pdf {
                    background: #2196F3 !important;
                    padding: 12px 30px !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 4px !important;
                    cursor: pointer !important;
                    font-weight: bold !important;
                    font-size: 14px !important;
                    width: 100% !important;
                    max-width: 300px !important;
                    margin-bottom: 10px !important;
                }
                .btn-pdf:hover {
                    background: #1976D2 !important;
                    transform: translateY(-2px) !important;
                    transition: all 0.3s ease !important;
                }
                .btn-pdf:disabled {
                    background: #90CAF9 !important;
                    cursor: not-allowed !important;
                    transform: none !important;
                }
                
                /* Estilos para a barra de progresso */
                .progress-container {
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
                }
                
                .progress-bar {
                    width: 100%;
                    height: 20px;
                    background: #e0e0e0;
                    border-radius: 10px;
                    margin: 20px 0;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4CAF50, #8BC34A);
                    border-radius: 10px;
                    transition: width 0.3s ease;
                    width: 0%;
                }
                
                .progress-text {
                    font-weight: bold;
                    color: #333;
                    margin-top: 10px;
                }
                
                .progress-title {
                    color: #333;
                    margin-bottom: 15px;
                    font-size: 18px;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Inserir o botão depois do botão de imprimir
        const printButton = buttonContainer.querySelector('.btn-print');
        printButton.parentNode.insertBefore(pdfButton, printButton.nextSibling);
    }
}

function clearForm() {
    if (isSaving) return;
    
    if (confirm('Deseja realmente limpar todo o formulário? Os dados não salvos serão perdidos.')) {
        clearAllFields();
        showMessage('Formulário limpo com sucesso!');
    }
}

// Criar elemento da barra de progresso
function createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.id = 'progress-bar';
    progressContainer.className = 'progress-container';
    
    progressContainer.innerHTML = `
        <div class="progress-title">Salvando dados...</div>
        <div class="progress-bar">
            <div id="progress-fill" class="progress-fill"></div>
        </div>
        <div id="progress-text" class="progress-text">0%</div>
    `;
    
    document.body.appendChild(progressContainer);
}

// Carregar página com formulário vazio
window.addEventListener('DOMContentLoaded', () => {
    // Inicializar statusData
    itemIds.forEach(id => {
        statusData[id] = null;
    });
    
    // Criar barra de progresso
    createProgressBar();
    
    // Adicionar event listeners aos checkboxes de status
    document.querySelectorAll('.status-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', () => selectStatus(checkbox));
    });
    
    // Adicionar botão de PDF
    addPDFButton();
    
    // Atualizar contadores inicialmente
    updateCounters();
    
    showMessage('Formulário pronto para uso. Selecione o status para cada item.');
});

// Adicionar funcionalidade de atalhos de teclado
document.addEventListener('keydown', (e) => {
    if (isSaving) return; // Bloqueia atalhos durante salvamento
    
    // Ctrl + S para salvar
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToGoogleSheet();
    }
    // Ctrl + P para imprimir
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
    // Ctrl + D para limpar
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        clearForm();
    }
    // Ctrl + Shift + P para salvar como PDF
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        saveAsPDF();
    }
});

// Função para verificar se o formulário tem dados
function hasFormData() {
    let hasData = false;
    
    // Verificar campos de texto
    textFieldIds.forEach(fieldId => {
        if (document.getElementById(fieldId).value.trim() !== '') {
            hasData = true;
        }
    });
    
    // Verificar se algum item foi avaliado
    itemIds.forEach(id => {
        if (statusData[id]) {
            hasData = true;
        }
    });
    
    return hasData;
}

// Adicionar aviso ao sair da página se houver dados não salvos
window.addEventListener('beforeunload', (e) => {
    if (hasFormData() && !isSaving) {
        e.preventDefault();
        e.returnValue = 'Existem dados não salvos no formulário. Tem certeza que deseja sair?';
        return e.returnValue;
    }
});