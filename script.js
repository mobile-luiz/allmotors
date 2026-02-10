// Configuração - SUBSTITUA COM SUA URL DO APPS SCRIPT
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_wyZJH0vNDwM5SwhmbkujP2YChYs6CqjSMqCdbQEfiGmGKcSiL7w4cpyyXYZOxSTz/exec';

// Sistema de cache para evitar múltiplos envios
let isSaving = false;

// ==================== LISTA DE ITENS OBRIGATÓRIOS ====================
// APENAS OS ITENS QUE REALMENTE DEVEM TER STATUS (99 itens)
const itensObrigatorios = [
    // Avaliação Inicial (4 itens)
    'dtc_motor', 'dtc_transmissao', 'dtc_seguranca', 'dtc_carroceria',
    
    // Motor (12 itens)
    'condicao_bateria', 'alternador', 'terminal_bateria', 'vazamento_oleo',
    'velas_ignicao', 'bobinas_cabos', 'correia_dentada', 'correia_acessorios',
    'rolamentos_polias', 'tbi', 'condicao_nivel_oleo', 'filtro_ar_motor',
    
    // Arrefecimento (8 itens)
    'condicao_fluido_arref', 'vazamentos_arref', 'mangueiras_arref',
    'bomba_agua', 'radiador', 'tampa_arref', 'reservatorio', 'eletroventilador',
    
    // Freios (10 itens)
    'condicao_fluido_freio', 'flexiveis_freio', 'pastilhas_dianteira',
    'discos_dianteiro', 'tambor_disco_traseiro', 'pastilhas_sapata_traseira',
    'cilindro_roda', 'pincas', 'cabos_freio', 'modulo_abs',
    
    // Direção (7 itens)
    'condicao_fluido_direcao', 'bomba_hidraulica', 'caixa_direcao',
    'mangueiras_direcao', 'coluna', 'terminal_direcao', 'barra_axial',
    
    // Transmissão (13 itens)
    'condicao_fluido_transmissao', 'vazamentos_transmissao', 'diferencial_ruidos',
    'caixa_transferencia_ruidos', 'coifas_transmissao', 'homocinetica',
    'trizeta_tulipa', 'semi_eixos', 'coxim_diferencial', 'carda_folga_ruido',
    'rolamento_cubo_dianteiro', 'rolamento_cubo_traseiro', 'bolachao_carda',
    
    // Coxins (2 itens)
    'coxins_motor', 'coxins_cambio',
    
    // Suspensão Dianteira (12 itens)
    'bieletas_dianteira', 'buchas_bandeja_inf', 'buchas_bandeja_sup',
    'pivo_dianteiro', 'bucha_barra_estabilizadora', 'bucha_quadro_dianteira',
    'amortecedores_dianteiros', 'coxim_suspensao', 'rolamento_peso_dianteiro',
    'coifa_batente_dianteiro', 'mola_dianteira', 'calco_mola_dianteira',
    
    // Suspensão Traseira (15 itens)
    'bucha_manga_eixo', 'bucha_bandeja_inferior', 'bucha_bandeja_superior',
    'bucha_braco_tensor', 'braco_auxiliar_bucha_pivo', 'bucha_braco_oscilante',
    'calco_mola_traseira', 'batente_mola', 'mola_traseira',
    'coifa_batente_traseiro', 'coxim_amortecedor', 'amortecedor_traseiro',
    'bieleta_traseira', 'bucha_barra_estabilizadora_traseira', 'barra_estabilizadora_traseira',
    
    // Lâmpadas Dianteiras (6 itens)
    'farol_baixo', 'farol_alto', 'lanterna_dianteira', 'neblina', 'pisca_dianteiro', 'drl',
    
    // Lâmpadas Traseiras (5 itens)
    'lanterna_traseira', 'freio_breaklight', 'pisca_traseiro', 're', 'luz_placa',
    
    // Pneus (3 itens)
    'pneus_dianteiro', 'pneus_traseiro', 'estepe',

    // Limpador Para-Brisas (2 itens)
    'limpador_dianteiro', 'limpador_traseiro'
];

// TOTAL de itens OBRIGATÓRIOS: 99 itens (com status)

// Lista de TODOS os itens (incluindo Observações Gerais sem status)
const todosItens = [...itensObrigatorios, 'observacoes_gerais'];

// Array com todos os IDs dos campos de texto do cliente
const textFieldIds = [
    'nomeCliente', 'telefones', 'email', 'cpf', 'placa', 'fabricante',
    'modelo', 'ano', 'motor', 'portas', 'combustivel', 'tanque',
    'km', 'direcao', 'ar', 'cor', 'dataEntrada', 'numOrdem'
];

// Objeto para armazenar o status de cada item
const statusData = {};
// Objeto para armazenar as descrições dos técnicos
const descricaoData = {};

// ==================== SISTEMA DE LOGIN ====================

async function handleLogin() {
    const userValue = document.getElementById('user').value;
    const passValue = document.getElementById('pass').value;
    const btn = document.getElementById('login-btn');
    const msg = document.getElementById('login-msg');

    if (!userValue || !passValue) {
        msg.innerText = "Preencha todos os campos.";
        return;
    }

    btn.disabled = true;
    btn.innerText = "Autenticando...";
    msg.innerText = "";

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'login',
                usuario: userValue,
                senha: passValue
            })
        });

        const result = await response.json();

        if (result.success) {
            const displayTarget = document.getElementById('user-display');
            if (displayTarget) {
                displayTarget.innerText = result.userEmail;
            }
            
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            document.getElementById('pass').value = "";
            
            // Inicializar os dados
            initializeData();
            
            console.log("Login realizado com sucesso para:", result.userEmail);
        } else {
            msg.innerText = result.message || "Usuário ou senha incorretos.";
        }
    } catch (error) {
        console.error("Erro técnico no login:", error);
        msg.innerText = "Erro de conexão. Verifique sua Internet.";
    } finally {
        btn.disabled = false;
        btn.innerText = "ENTRAR";
    }
}

// ==================== INICIALIZAÇÃO DE DADOS ====================

function initializeData() {
    console.log('Inicializando dados...');
    
    // Inicializar todos os itens
    todosItens.forEach(id => {
        if (id === 'observacoes_gerais') {
            // Observações Gerais não tem status, apenas descrição
            statusData[id] = null;
        } else {
            // Itens obrigatórios começam sem status
            statusData[id] = null;
        }
        descricaoData[id] = '';
    });
    
    // Configurar eventos nos checkboxes
    document.querySelectorAll('.status-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', () => {
            selectStatus(checkbox);
        });
    });
    
    // Configurar eventos nos campos de descrição
    document.querySelectorAll('.descricao-input').forEach(input => {
        const id = input.getAttribute('data-id').replace('descricao_', '');
        input.addEventListener('input', function() {
            descricaoData[id] = this.value.trim();
        });
    });
    
    // Atualizar contadores
    updateCounters();
    
    // Iniciar verificação de status obrigatórios
    verificarStatusObrigatorios();
    
    // Configurar verificação periódica
    setInterval(verificarStatusObrigatorios, 2000);
    
    console.log('Dados inicializados. Itens obrigatórios:', itensObrigatorios.length);
}

// ==================== SISTEMA DE STATUS ====================

function selectStatus(checkbox) {
    if (isSaving) return;
    
    const itemId = checkbox.getAttribute('data-id');
    const status = checkbox.getAttribute('data-status');
    
    // Desmarcar todas as checkboxes deste item
    document.querySelectorAll(`.status-checkbox[data-id="${itemId}"]`).forEach(cb => {
        cb.classList.remove('checked');
    });
    
    // Marcar a checkbox clicada
    checkbox.classList.add('checked');
    statusData[itemId] = status;
    
    // Destacar campo de descrição correspondente
    const descricaoInput = document.querySelector(`.descricao-input[data-id="descricao_${itemId}"]`);
    if (descricaoInput) {
        descricaoInput.style.borderLeft = "4px solid " + 
            (status === 'ok' ? '#28a745' : 
             status === 'atencao' ? '#ffc107' : 
             '#dc3545');
        
        // Focar no campo de descrição para status não OK
        if (status !== 'ok') {
            setTimeout(() => {
                descricaoInput.focus();
            }, 100);
        }
    }
    
    updateCounters();
}

function updateCounters() {
    let okCount = 0, atencaoCount = 0, criticoCount = 0;
    
    itensObrigatorios.forEach(id => {
        const status = statusData[id];
        if (status === 'ok') okCount++;
        else if (status === 'atencao') atencaoCount++;
        else if (status === 'critico') criticoCount++;
    });
    
    document.getElementById('count-ok').textContent = okCount;
    document.getElementById('count-atencao').textContent = atencaoCount;
    document.getElementById('count-critico').textContent = criticoCount;
}

// ==================== SISTEMA DE VERIFICAÇÃO DE OBRIGATORIEDADE ====================

function verificarStatusObrigatorios() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent || mainContent.style.display === 'none') {
        return;
    }
    
    const itensNaoAvaliados = itensObrigatorios.filter(id => !statusData[id]);
    const botaoSalvar = document.querySelector('button[onclick*="saveToGoogleSheet"]');
    const totalObrigatorios = itensObrigatorios.length;
    const itensAvaliados = totalObrigatorios - itensNaoAvaliados.length;
    
    if (botaoSalvar) {
        if (itensNaoAvaliados.length > 0) {
            botaoSalvar.style.opacity = '0.6';
            botaoSalvar.title = itensNaoAvaliados.length + ' itens obrigatórios pendentes (' + itensAvaliados + '/' + totalObrigatorios + ')';
            botaoSalvar.innerHTML = 'SALVAR (' + itensAvaliados + '/' + totalObrigatorios + ')';
        } else {
            botaoSalvar.style.opacity = '1';
            botaoSalvar.title = 'Todos os 99 itens obrigatórios foram avaliados';
            botaoSalvar.innerHTML = 'SALVAR NA PLANILHA ✓';
        }
    }
    
    // Contador de pendentes
    let contadorPendentes = document.getElementById('count-pendentes');
    
    if (!contadorPendentes && itensNaoAvaliados.length > 0) {
        contadorPendentes = document.createElement('div');
        contadorPendentes.id = 'count-pendentes';
        contadorPendentes.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #ffc107;
            color: #000;
            padding: 10px 15px;
            border-radius: 5px;
            font-weight: bold;
            z-index: 999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: 14px;
        `;
        document.body.appendChild(contadorPendentes);
    }
    
    if (contadorPendentes) {
        if (itensNaoAvaliados.length > 0) {
            contadorPendentes.textContent = itensNaoAvaliados.length + ' itens pendentes (' + itensAvaliados + '/' + totalObrigatorios + ')';
            contadorPendentes.style.display = 'block';
            
            if (itensNaoAvaliados.length > 20) {
                contadorPendentes.style.background = '#dc3545';
                contadorPendentes.style.color = 'white';
            } else if (itensNaoAvaliados.length > 10) {
                contadorPendentes.style.background = '#ffc107';
                contadorPendentes.style.color = '#000';
            } else {
                contadorPendentes.style.background = '#28a745';
                contadorPendentes.style.color = 'white';
            }
        } else {
            contadorPendentes.style.display = 'none';
        }
    }
}

// ==================== SISTEMA DE MENSAGENS ====================

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

// ==================== SISTEMA DE PROGRESSO ====================

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

// ==================== SISTEMA DE BOTÕES ====================

function toggleButtons(disable) {
    const buttons = document.querySelectorAll('button');
    const checkboxes = document.querySelectorAll('.status-checkbox');
    const textFields = document.querySelectorAll('input[type="text"], input[type="date"]');
    const textareas = document.querySelectorAll('.descricao-input');
    
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
    
    textareas.forEach(textarea => {
        textarea.disabled = disable;
        textarea.style.opacity = disable ? '0.5' : '1';
        textarea.style.backgroundColor = disable ? '#f5f5f5' : 'white';
    });
}

// ==================== SISTEMA DE MODAL ====================

function openModal() {
    document.getElementById('confirmModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

function confirmSave() {
    closeModal();
    if (!isSaving) {
        isSaving = true;
        saveToGoogleSheetConfirmed();
    }
}

// ==================== SISTEMA DE LIMPEZA ====================

function clearAllFields() {
    // Limpar campos de texto do cliente
    textFieldIds.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });

    // Limpar status e descrições
    todosItens.forEach(id => {
        if (id !== 'observacoes_gerais') {
            statusData[id] = null;
            
            // Limpar checkboxes
            document.querySelectorAll(`.status-checkbox[data-id="${id}"]`).forEach(cb => {
                cb.classList.remove('checked');
            });
        }
        
        descricaoData[id] = '';
        
        // Limpar campos de descrição
        const descricaoInput = document.querySelector(`.descricao-input[data-id="descricao_${id}"]`);
        if (descricaoInput) {
            descricaoInput.value = '';
            if (id !== 'observacoes_gerais') {
                descricaoInput.style.borderLeft = '';
            }
        }
    });
    
    updateCounters();
    verificarStatusObrigatorios();
}

function clearForm() {
    if (isSaving) {
        showMessage('Aguarde o término da operação atual.', true);
        return;
    }
    
    if (confirm('Deseja realmente limpar todo o formulário? Os dados não salvos serão perdidos.')) {
        clearAllFields();
        showMessage('Formulário limpo com sucesso!');
    }
}

// ==================== SISTEMA DE SALVAMENTO ====================

async function saveToGoogleSheet() {
    // Evitar múltiplos cliques
    if (isSaving) {
        showMessage('Aguarde o salvamento anterior ser concluído.', true);
        return;
    }

    // Verificar campos obrigatórios básicos
    const camposObrigatorios = ['placa', 'modelo', 'dataEntrada', 'numOrdem'];
    let camposFaltando = [];
    
    camposObrigatorios.forEach(campo => {
        const valor = document.getElementById(campo).value.trim();
        if (!valor) {
            camposFaltando.push(campo);
        }
    });
    
    if (camposFaltando.length > 0) {
        showMessage('Preencha os campos obrigatórios: ' + camposFaltando.join(', '), true);
        return;
    }
    
    // Verificar os 99 itens obrigatórios
    let itensNaoAvaliados = [];
    itensObrigatorios.forEach(id => {
        if (!statusData[id]) {
            itensNaoAvaliados.push(id);
        }
    });
    
    // Exibir erro se algum item obrigatório não foi avaliado
    if (itensNaoAvaliados.length > 0) {
        showMessage('ATENÇÃO: ' + itensNaoAvaliados.length + ' itens obrigatórios não foram avaliados! É necessário avaliar todos os itens do checklist antes de salvar.', true);
        
        // Rolagem automática para o primeiro item não avaliado
        if (itensNaoAvaliados.length > 0) {
            const primeiroId = itensNaoAvaliados[0];
            const elementoPrimeiroItem = document.querySelector('.status-checkbox[data-id="' + primeiroId + '"]');
            if (elementoPrimeiroItem) {
                elementoPrimeiroItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const itemContainer = elementoPrimeiroItem.closest('.item');
                if (itemContainer) {
                    itemContainer.style.backgroundColor = '#fff3cd';
                    itemContainer.style.border = '2px solid #ffc107';
                    itemContainer.style.borderRadius = '8px';
                    setTimeout(() => {
                        itemContainer.style.backgroundColor = '';
                        itemContainer.style.border = '';
                    }, 5000);
                }
            }
        }
        return;
    }
    
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
            const element = document.getElementById(fieldId);
            clientData[fieldId] = element ? element.value : '';
        });

        // Preparar dados do checklist
        updateProgressBar(40);
        const checklistData = {};
        
        todosItens.forEach(id => {
            const status = statusData[id];
            const descricao = descricaoData[id] || '';
            
            // Se for Observações Gerais (sem status)
            if (id === 'observacoes_gerais') {
                if (descricao) {
                    checklistData[id] = '📝 ' + descricao;
                } else {
                    checklistData[id] = '';
                }
            } 
            // Se for item com status (99 itens obrigatórios)
            else {
                let emojiTexto = '';
                if (status === 'ok') emojiTexto = '🟢 OK';
                else if (status === 'atencao') emojiTexto = '🟡 ATENÇÃO';
                else if (status === 'critico') emojiTexto = '🔴 CRÍTICO';
                
                // Se há descrição, adicionar após o status
                if (descricao) {
                    checklistData[id] = emojiTexto + ' - ' + descricao;
                } else {
                    checklistData[id] = emojiTexto;
                }
            }
        });

        // Combinar todos os dados
        updateProgressBar(60);
        const allData = {
            ...clientData,
            ...checklistData,
            timestamp: new Date().toLocaleString('pt-BR'),
            tecnico_logado: document.getElementById('user-display').innerText,
            total_ok: document.getElementById('count-ok').textContent,
            total_atencao: document.getElementById('count-atencao').textContent,
            total_critico: document.getElementById('count-critico').textContent
        };
        
        console.log('Dados a serem enviados:', {
            cliente: clientData.nomeCliente,
            placa: clientData.placa,
            itensObrigatorios: itensObrigatorios.length,
            itensSalvos: Object.keys(checklistData).length
        });
        
        showMessage('Enviando dados para o servidor...', false);
        updateProgressBar(80);
        
        // Enviar para Google Sheets
        const response = await fetch(SCRIPT_URL, {
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
        
        // Gerar PDF
        const dadosParaPDF = {
            ...allData
        };
        
        // Adicionar descrições separadas para o PDF
        todosItens.forEach(id => {
            dadosParaPDF['descricao_' + id] = descricaoData[id] || '';
        });
        
        // GERAR PDF AUTOMATICAMENTE
        const pdfGerado = await generateComprovantePDF(dadosParaPDF);
        
        if (pdfGerado) {
            showComprovanteSuccess();
        }
        
        // Limpar formulário após sucesso
        setTimeout(() => {
            clearAllFields();
            showMessage('Formulário limpo automaticamente. Pronto para novo checklist!');
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showMessage('Erro ao salvar dados. Verifique a conexão.', true);
    } finally {
        toggleProgressBar(false);
        toggleButtons(false);
        isSaving = false;
    }
}

// ==================== SISTEMA DE PDF ====================

async function generateComprovantePDF(dadosSalvos) {
    return new Promise((resolve) => {
        try {
            if (typeof jsPDF === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = () => createComprovantePDF(dadosSalvos).then(resolve);
                script.onerror = () => {
                    console.warn('Falha ao carregar jsPDF, exibindo na tela');
                    showComprovanteTela(dadosSalvos);
                    resolve();
                };
                document.head.appendChild(script);
                return;
            }
            
            createComprovantePDF(dadosSalvos).then(resolve);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            showComprovanteTela(dadosSalvos);
            resolve();
        }
    });
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error("Não foi possível carregar a imagem"));
    });
}

function formatarDataBR(dataString) {
    if (!dataString) return '-';
    const partes = dataString.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return dataString;
}

async function createComprovantePDF(dados) {
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const margin = 15;
        let yPos = 10;

        // 1. CABEÇALHO: LOGOTIPO
        try {
            const logoImg = await loadImage('logo.png');
            const maxWidth = 180;
            const maxHeight = 45; 
            let finalWidth = logoImg.width;
            let finalHeight = logoImg.height;
            const ratio = Math.min(maxWidth / finalWidth, maxHeight / finalHeight);
            finalWidth = finalWidth * ratio;
            finalHeight = finalHeight * ratio;
            const xLogo = (pageWidth - finalWidth) / 2;
            pdf.addImage(logoImg, 'PNG', xLogo, yPos, finalWidth, finalHeight);
            yPos += finalHeight + 10; 
        } catch (e) {
            console.warn('Logo não encontrada, continuando sem imagem');
            yPos = 25;
        }

        // 2. DATA DE GERAÇÃO
        const dataGeracao = new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        pdf.setTextColor(100);
        pdf.setFontSize(8);
        pdf.text(`Gerado em: ${dataGeracao}`, pageWidth - margin, 12, { align: 'right' });

        // 3. INFORMAÇÕES DO CLIENTE / VEÍCULO
        pdf.setTextColor(0);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INFORMAÇÕES DO CLIENTE / VEÍCULO', margin, yPos);
        yPos += 2;
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 7;

        pdf.setFontSize(9);
        const col1 = margin;
        const col2 = 80;
        const col3 = 145;
        const dataEntradaFormatada = formatarDataBR(dados.dataEntrada);

        const campos = [
            { 
                c1: ['PLACA:', (dados.placa || '---').toUpperCase()], 
                c2: ['MODELO:', (dados.modelo || '---').toUpperCase()], 
                c3: ['COR:', (dados.cor || '---').toUpperCase()] 
            },
            { 
                c1: ['DATA:', dataEntradaFormatada], 
                c2: ['Nº ORDEM:', dados.numOrdem || '---'], 
                c3: ['TÉCNICO:', (dados.tecnico_logado || '---')]
            }
        ];

        campos.forEach(linha => {
            pdf.setFont('helvetica', 'bold'); 
            pdf.text(String(linha.c1[0]), col1, yPos);
            pdf.setFont('helvetica', 'normal'); 
            pdf.text(String(linha.c1[1] || '-'), col1 + 18, yPos);
            
            pdf.setFont('helvetica', 'bold'); 
            pdf.text(String(linha.c2[0]), col2, yPos);
            pdf.setFont('helvetica', 'normal'); 
            pdf.text(String(linha.c2[1] || '-'), col2 + 18, yPos);
            
            pdf.setFont('helvetica', 'bold'); 
            pdf.text(String(linha.c3[0]), col3, yPos);
            pdf.setFont('helvetica', 'normal'); 
            pdf.text(String(linha.c3[1] || '-'), col3 + 20, yPos);
            yPos += 6;
        });

        yPos += 4;

        // 4. DETALHAMENTO DA INSPEÇÃO
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DETALHAMENTO DA INSPEÇÃO', margin, yPos);
        yPos += 2;
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        pdf.setFontSize(8.5);
        
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
            "LÂMPADAS DIANTEIRAS": ['farol_baixo', 'farol_alto', 'lanterna_dianteira', 'neblina', 'pisca_dianteiro', 'drl'],
            "LÂMPADAS TRASEIRAS": ['lanterna_traseira', 'freio_breaklight', 'pisca_traseiro', 're', 'luz_placa'],
            "PNEUS": ['pneus_dianteiro', 'pneus_traseiro', 'estepe'],
            "LIMPADOR PARA-BRISAS": ['limpador_dianteiro', 'limpador_traseiro'],
            "OBSERVAÇÕES GERAIS": ['observacoes_gerais']
        };

        const renderCategoria = (titulo, ids) => {
            if (yPos > 270) { 
                pdf.addPage(); 
                yPos = 20; 
            }
            
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 102, 204);
            pdf.text(titulo, margin, yPos);
            yPos += 5;
            
            ids.forEach((id, index) => {
                if (yPos > 280) { 
                    pdf.addPage(); 
                    yPos = 20; 
                }
                
                let currentX = margin + 5;
                let isObservacoes = (titulo === "OBSERVAÇÕES GERAIS");
                
                if (!isObservacoes) {
                    currentX = (index % 2 === 0) ? margin + 5 : 110;
                }
                
                const statusTexto = dados[id] || ''; 
                let prefixo = '[   ]', r=150, g=150, b=150;

                if (statusTexto.includes('🟢')) { 
                    r=0; g=128; b=0; 
                    prefixo = '[ OK ]'; 
                } else if (statusTexto.includes('🟡')) { 
                    r=200; g=120; b=0; 
                    prefixo = '[ ! ]'; 
                } else if (statusTexto.includes('🔴')) { 
                    r=180; g=0; b=0; 
                    prefixo = '[ X ]'; 
                }

                pdf.setTextColor(r, g, b);
                pdf.setFont('helvetica', 'bold');
                pdf.text(prefixo, currentX, yPos);
                pdf.setTextColor(0, 0, 0); 
                
                const itemLabel = getNomeAmigavelItem(id);
                pdf.text(itemLabel, currentX + 12, yPos);
                
                const descricaoKey = 'descricao_' + id;
                if (dados[descricaoKey] && dados[descricaoKey].trim()) {
                    yPos += 3.5;
                    pdf.setFontSize(7);
                    pdf.setTextColor(80, 80, 80);
                    pdf.setFont('helvetica', 'italic');
                    
                    const descricao = dados[descricaoKey];
                    const maxWidth = isObservacoes ? 180 : 90;
                    let lines = pdf.splitTextToSize((isObservacoes ? 'Observações: ' : 'Observação: ') + descricao, maxWidth);
                    
                    lines.forEach(line => {
                        if (yPos > 280) { 
                            pdf.addPage(); 
                            yPos = 20; 
                        }
                        pdf.text(line, currentX + 12, yPos);
                        yPos += 3.5;
                    });
                    
                    pdf.setFontSize(8.5);
                }
                
                if (index % 2 !== 0 || index === ids.length - 1 || isObservacoes) {
                    yPos += 5;
                }
            });
            yPos += 2;
        };

        for (const [titulo, ids] of Object.entries(categorias)) {
            renderCategoria(titulo, ids);
        }

        // 5. RESUMO TOTALIZADOR
        const tOk = parseInt(dados.total_ok || 0);
        const tAtencao = parseInt(dados.total_atencao || 0);
        const tCritico = parseInt(dados.total_critico || 0);
        const totalGeral = tOk + tAtencao + tCritico;

        yPos += 10;
        if (yPos > 240) { 
            pdf.addPage(); 
            yPos = 20; 
        }

        pdf.setDrawColor(200);
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, yPos, pageWidth - (margin * 2), 25, 'F');
        
        yPos += 7;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0);
        pdf.text('RESUMO DA AVALIAÇÃO FINAL', pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 10;
        pdf.setTextColor(0, 128, 0);
        pdf.text(`OK: ${tOk}`, margin + 10, yPos);
        pdf.setTextColor(200, 120, 0);
        pdf.text(`ATENÇÃO: ${tAtencao}`, margin + 55, yPos);
        pdf.setTextColor(180, 0, 0);
        pdf.text(`CRÍTICO: ${tCritico}`, margin + 100, yPos);
        pdf.setTextColor(0, 102, 204);
        pdf.text(`TOTAL AVALIADO: ${totalGeral}`, pageWidth - margin - 50, yPos);

        // 6. ASSINATURA
        yPos += 25;
        if (yPos > 275) { 
            pdf.addPage(); 
            yPos = 30; 
        }
        pdf.setDrawColor(0);
        pdf.line(60, yPos + 10, pageWidth - 60, yPos + 10);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0);
        pdf.text('Assinatura do Responsável Técnico', pageWidth / 2, yPos + 15, { align: 'center' });

        // Nome do arquivo
        const nomeArquivo = 'Checklist_' + (dados.nomeCliente || 'Cliente') + '_' + (dados.placa || 'SemPlaca') + '.pdf';
        pdf.save(nomeArquivo);

        return true;
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        return false;
    }
}

function getNomeAmigavelItem(id) {
    const nomes = {
        'farol_baixo': 'FAROL BAIXO',
        'farol_alto': 'FAROL ALTO',
        'lanterna_dianteira': 'LANTERNA DIANTEIRA',
        'neblina': 'FAROL NEBLINA',
        'pisca_dianteiro': 'PISCA DIANTEIRO',
        'drl': 'DRL (LUZ DE DIA)',
        'lanterna_traseira': 'LANTERNA TRASEIRA',
        'freio_breaklight': 'LUZ DE FREIO',
        'pisca_traseiro': 'PISCA TRASEIRO',
        're': 'LUZ DE RÉ',
        'luz_placa': 'LUZ DA PLACA',
        'pneus_dianteiro': 'PNEUS DIANTEIROS',
        'pneus_traseiro': 'PNEUS TRASEIROS',
        'estepe': 'ESTEPE',
        'limpador_dianteiro': 'LIMPADOR DIANTEIRO',
        'limpador_traseiro': 'LIMPADOR TRASEIRO',
        'observacoes_gerais': 'OBSERVAÇÕES GERAIS'
    };
    
    return nomes[id] || id.replace(/_/g, ' ').toUpperCase();
}

function showComprovanteTela(dados) {
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
        
        <div style="text-align: center; margin-top: 40px;">
            <button onclick="imprimirComprovante()" style="background: #2196F3; color: white; border: none; padding: 12px 30px; border-radius: 4px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                🖨️ Imprimir
            </button>
            <button onclick="fecharComprovante()" style="background: #666; color: white; border: none; padding: 12px 30px; border-radius: 4px; font-size: 16px; cursor: pointer;">
                ✕ Fechar
            </button>
        </div>
    `;
    
    document.body.appendChild(comprovanteDiv);
    
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
    };
}

function showComprovanteSuccess() {
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

// ==================== INICIALIZAÇÃO DA PÁGINA ====================

// Inicialização quando o DOM está carregado
window.addEventListener('DOMContentLoaded', () => {
    // Criar barra de progresso
    createProgressBar();
    
    // Mostrar mensagem inicial
    showMessage('Sistema pronto. Faça login para começar.');
    
    console.log('Sistema inicializado. Itens obrigatórios:', itensObrigatorios.length);
});

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    if (isSaving) return;
    
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToGoogleSheet();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        clearForm();
    }
});

// Aviso ao sair da página se houver dados não salvos
window.addEventListener('beforeunload', (e) => {
    if (isSaving) return;
    
    const hasData = textFieldIds.some(fieldId => {
        const element = document.getElementById(fieldId);
        return element && element.value.trim() !== '';
    }) || itensObrigatorios.some(id => statusData[id]);
    
    if (hasData) {
        e.preventDefault();
        e.returnValue = 'Existem dados não salvos no formulário. Tem certeza que deseja sair?';
        return e.returnValue;
    }
});

// Timeout de segurança
setTimeout(() => {
    const progressBarVisible = document.getElementById('progress-bar') && 
                              document.getElementById('progress-bar').style.display === 'block';
    
    if (isSaving && progressBarVisible) {
        console.log('Safety timeout: Reativando interface...');
        toggleProgressBar(false);
        toggleButtons(false);
        isSaving = false;
        showMessage('Interface reativada automaticamente.', false);
    }
}, 30000);


