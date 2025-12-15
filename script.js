/* === BANCO DE DADOS DE TEXTOS (CHECKLISTS) === */
const CHECKLIST_DB = {
    pedagogica: {
        "1. Funções Cognitivas": [
            { label: "Atenção Instável", texto: "Demonstra dificuldade significativa em manter o foco em atividades dirigidas.", indicacao: "Atividades de curta duração." },
            { label: "Boa Atenção", texto: "Mantém atenção adequada nas atividades propostas.", indicacao: "" },
            { label: "Memória Comprometida", texto: "Dificuldade em reter instruções recentes e sequências simples.", indicacao: "Jogos da memória." }
        ],
        "2. Leitura e Escrita": [
            { label: "Pré-Silábico", texto: "Encontra-se em hipótese de escrita pré-silábica (garatujas/desenhos).", indicacao: "Estimulação da consciência fonológica." },
            { label: "Silábico", texto: "Escreve uma letra para cada sílaba sonora.", indicacao: "Atividades de completação." },
            { label: "Não Alfabetizado", texto: "Não domina o código alfabético.", indicacao: "Letramento lúdico." }
        ],
        "3. Matemática": [
            { label: "Não Identifica Numerais", texto: "Não identifica numerais básicos (0 a 10).", indicacao: "Jogos de bingo e músicas." },
            { label: "Contagem Mecânica", texto: "Conta verbalmente mas não associa à quantidade.", indicacao: "Contagem com material concreto." }
        ]
    },
    clinica: {
        "1. Saúde Geral": [
            { label: "Atraso DNPM", texto: "Histórico de atraso no Desenvolvimento Neuropsicomotor.", encam: "Avaliação Neuropediatra." },
            { label: "Convulsões", texto: "Relato de crises convulsivas controladas/em tratamento.", encam: "Neurologista." }
        ],
        "2. Linguagem": [
            { label: "Ausência de Fala", texto: "Não utiliza linguagem oral para comunicação.", encam: "Fonoaudiologia." },
            { label: "Ecolalia", texto: "Apresenta repetição de falas (ecolalia).", encam: "" }
        ]
    },
    social: {
        "1. Contexto Familiar": [
            { label: "Vulnerabilidade", texto: "Família em situação de vulnerabilidade socioeconômica.", encam: "Acompanhamento CRAS." },
            { label: "Participativa", texto: "Família demonstra interesse e participa da vida escolar.", encam: "" }
        ],
        "2. Benefícios": [
            { label: "Possui BPC", texto: "Família beneficiária do BPC.", encam: "" },
            { label: "Demanda BPC", texto: "Perfil para BPC, mas ainda não acessou.", encam: "Orientação para requerimento." }
        ]
    }
};

/* === BANCO DE DADOS DE ASSINATURAS (EDITÁVEL) === */
const DB_ASSINATURAS = {
    pedagoga: [
        { nome: "Jhenifer C. André", arquivo: "asspedagoda.jpg", cargo: "" },
        { nome: "Isabella F. Sanches", arquivo: "asspedagoda2.jpeg", cargo: "" },
        { nome: "--- Sem Assinatura ---", arquivo: "", cargo: "" }
    ],
    psicologa: [
        { nome: "Jaqueline G. Malaquim", arquivo: "asspsicologa.jpg", cargo: "" },
        { nome: "--- Sem Assinatura ---", arquivo: "", cargo: "" }
    ],
    /* AQUI ESTÁ A CONFIGURAÇÃO DA ASSISTENTE SOCIAL */
    social: [
        { nome: "Andréia C. Santos", arquivo: "asssocial.jpg", cargo: "" },
        { nome: "--- Sem Assinatura ---", arquivo: "", cargo: "" }
    ]
};

/* === VARIÁVEIS GLOBAIS === */
let dadosRelatorio = { pedagogica: { texto: '', extra: '' }, clinica: { texto: '', extra: '' }, social: { texto: '', extra: '' } };
let bancoRelatorios = []; // O array em memória para a lista de relatórios
let modalAtual = '';

/* === INICIALIZAÇÃO === */
document.addEventListener('DOMContentLoaded', () => {
    configurarInputs();
    
    // ATENÇÃO: Se o 'db' do Firebase não estiver definido (erro na configuração), isso falhará.
    if (typeof db !== 'undefined') {
        carregarBancoDeDados();
    } else {
        console.error("ERRO: Objeto 'db' do Firebase não encontrado. Verifique a configuração no index.html.");
    }
    
    // INICIALIZA AS 3 ASSINATURAS
    inicializarAssinaturas();

    if(!document.getElementById('reportId').value) {
        novoRelatorio(false); 
    }
    
    const hoje = new Date();
    document.getElementById('dataAtual').innerText = hoje.toLocaleDateString('pt-BR', {day:'numeric', month:'long', year:'numeric'});
});

/* === LÓGICA DE ASSINATURAS === */
function inicializarAssinaturas() {
    ['pedagoga', 'psicologa', 'social'].forEach(tipo => {
        const select = document.getElementById(`sel_${tipo}`);
        const lista = DB_ASSINATURAS[tipo];
        
        select.innerHTML = "";
        lista.forEach((prof, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.text = prof.nome;
            select.appendChild(option);
        });

        mudarAssinatura(tipo);
    });
}

function mudarAssinatura(tipo) {
    const select = document.getElementById(`sel_${tipo}`);
    const img = document.getElementById(`img_${tipo}`);
    const cargo = document.getElementById(`cargo_${tipo}`);
    const dados = DB_ASSINATURAS[tipo][select.value];

    if (dados.arquivo) {
        img.src = dados.arquivo;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }
    
    cargo.innerText = dados.cargo;
}

/* === SISTEMA DE BANCO DE DADOS (AGORA COM FIREBASE) === */

function carregarBancoDeDados() {
    // Escuta em tempo real (onSnapshot) a coleção 'relatorios', ordenando pelo mais recente
    db.collection("relatorios").orderBy("dataSalvo", "desc").onSnapshot((snapshot) => {
        bancoRelatorios = []; // Limpa o array global de relatórios
        snapshot.forEach((doc) => {
            // Adiciona o ID do documento do Firebase ao objeto, junto com todos os dados
            bancoRelatorios.push({ id: doc.id, ...doc.data() });
        });
        atualizarListaSidebar(); // Atualiza a lista na sidebar
        console.log("Dados carregados do Firebase:", bancoRelatorios.length);
    }, (error) => {
        console.error("Erro ao carregar dados do Firebase: ", error);
        alert("Erro ao conectar com o banco de dados compartilhado. Verifique sua conexão ou regras do Firebase.");
    });
}

function salvarNoBanco() {
    const nome = document.getElementById('nomeEstudante').value.trim();
    if(!nome) { alert("⚠️ Erro: Digite o NOME DO ESTUDANTE antes de salvar."); return; }

    // O ID do relatório é o ID do documento do Firebase
    const idAtual = document.getElementById('reportId').value;
    
    const inputsValores = {};
    document.querySelectorAll('input, textarea').forEach(el => {
        if(el.id && el.id !== 'buscaAluno') inputsValores[el.id] = el.value;
    });

    // Salva a seleção das 3 assinaturas
    inputsValores['sel_pedagoga'] = document.getElementById('sel_pedagoga').value;
    inputsValores['sel_psicologa'] = document.getElementById('sel_psicologa').value;
    inputsValores['sel_social'] = document.getElementById('sel_social').value;

    const relatorioObjeto = {
        nome: nome,
        // Usa o timestamp do servidor do Firebase
        dataSalvo: firebase.firestore.FieldValue.serverTimestamp(), 
        dadosRelatorio: dadosRelatorio,
        inputs: inputsValores
    };

    // Referência do documento: se tem ID, usa o existente; se não, cria uma nova referência
    const docRef = idAtual ? db.collection("relatorios").doc(idAtual) : db.collection("relatorios").doc();

    docRef.set(relatorioObjeto, { merge: true }) // Salva/Atualiza (merge: true evita sobrescrever campos não mencionados)
        .then(() => {
            // Garante que o ID do Firebase é salvo no campo oculto para futuras atualizações
            document.getElementById('reportId').value = docRef.id; 
            
            // Feedback visual
            const btn = document.getElementById('btnSalvar');
            const htmlOrig = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> SALVO!';
            btn.classList.add('btn-verde'); 
            setTimeout(() => { btn.innerHTML = htmlOrig; btn.classList.remove('btn-verde'); }, 2000);

            // A lista será atualizada automaticamente pelo onSnapshot
        })
        .catch((error) => {
            console.error("Erro ao salvar no Firebase:", error);
            alert("Erro ao salvar o relatório. Verifique as regras de segurança do seu Firestore.");
        });
}

function atualizarListaSidebar() {
    const lista = document.getElementById('lista-alunos');
    lista.innerHTML = "";
    const termo = document.getElementById('buscaAluno').value.toLowerCase();
    
    // O array 'bancoRelatorios' já está ordenado pelo onSnapshot do Firebase

    bancoRelatorios.forEach(rel => {
        if(rel.nome.toLowerCase().includes(termo)) {
            // Formata a data. Se for um timestamp do Firebase, converte. Se for string antiga, usa a string.
            const dataExibicao = rel.dataSalvo && typeof rel.dataSalvo.toDate === 'function' 
                               ? rel.dataSalvo.toDate().toLocaleString('pt-BR') 
                               : (rel.dataSalvo || 'Sem Data');
            
            const div = document.createElement('div');
            div.className = 'item-aluno';
            div.innerHTML = `
                <h4>${rel.nome}</h4>
                <span><i class="far fa-clock"></i> ${dataExibicao}</span>
                <button class="btn-apagar-item" title="Excluir" onclick="deletarRelatorio('${rel.id}', event)"><i class="fas fa-trash"></i></button>
            `;
            div.onclick = (e) => {
                if(!e.target.closest('.btn-apagar-item')) carregarRelatorio(rel.id);
            };
            lista.appendChild(div);
        }
    });
}

function carregarRelatorio(id) {
    const rel = bancoRelatorios.find(r => r.id === id);
    if(!rel) return;

    if(!confirm(`Deseja abrir o relatório de "${rel.nome}"? \nDados não salvos na tela atual serão perdidos.`)) return;

    if(rel.inputs) {
        for (const [key, valor] of Object.entries(rel.inputs)) {
            const el = document.getElementById(key);
            if(el) {
                el.value = valor;
                if(el.tagName === 'TEXTAREA' && el.mirrorDiv) {
                    el.mirrorDiv.innerText = valor;
                    ajustarAltura(el);
                }
                // Carrega a seleção dos profissionais
                if(key.startsWith('sel_')) {
                    el.dispatchEvent(new Event('change'));
                }
            }
        }
    }

    if(rel.dadosRelatorio) dadosRelatorio = rel.dadosRelatorio;

    document.getElementById('reportId').value = rel.id;
    atualizarStatusVisual('pedagogica');
    atualizarStatusVisual('clinica');
    atualizarStatusVisual('social');
    calcularIdade();
    toggleSidebar();
}

function deletarRelatorio(id, event) {
    event.stopPropagation();
    if(confirm("ATENÇÃO: Deseja EXCLUIR PERMANENTEMENTE este relatório?")) {
        db.collection("relatorios").doc(id).delete()
            .then(() => {
                console.log("Documento deletado com sucesso do Firebase.");
                // A lista é atualizada automaticamente pelo onSnapshot
                if(document.getElementById('reportId').value === id) novoRelatorio(false);
            })
            .catch((error) => {
                console.error("Erro ao remover documento no Firebase: ", error);
                alert("Erro ao tentar deletar o relatório.");
            });
    }
}

function novoRelatorio(perguntar = true) {
    if(perguntar && !confirm("Deseja limpar a tela para iniciar um NOVO aluno?")) return;

    document.querySelectorAll('input, textarea').forEach(el => {
        if(['nre','municipio','escola','buscaAluno'].includes(el.id)) return;
        el.value = "";
        if(el.mirrorDiv) el.mirrorDiv.innerText = "";
    });
    
    // Reseta selects para a primeira opção
    ['pedagoga', 'psicologa', 'social'].forEach(tipo => {
        const sel = document.getElementById(`sel_${tipo}`);
        if(sel) { sel.value = 0; sel.dispatchEvent(new Event('change')); }
    });

    dadosRelatorio = { pedagogica: { texto: '', extra: '' }, clinica: { texto: '', extra: '' }, social: { texto: '', extra: '' } };
    
    atualizarStatusVisual('pedagogica');
    atualizarStatusVisual('clinica');
    atualizarStatusVisual('social');
    
    document.getElementById('reportId').value = "";
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('aberto'); }
function filtrarLista() { atualizarListaSidebar(); }

function configurarInputs() {
    document.querySelectorAll('textarea').forEach(tx => {
        const mirror = document.createElement('div');
        mirror.className = 'print-mirror';
        tx.parentNode.insertBefore(mirror, tx.nextSibling);
        tx.mirrorDiv = mirror;
        tx.addEventListener('input', () => {
            mirror.innerText = tx.value;
            ajustarAltura(tx);
        });
    });
    document.getElementById('dataNascimento').addEventListener('change', calcularIdade);
}

function ajustarAltura(el) {
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight + 2) + 'px';
}

function calcularIdade() {
    const nasc = document.getElementById('dataNascimento').value;
    if(nasc) {
        const hoje = new Date(); const n = new Date(nasc);
        let idade = hoje.getFullYear() - n.getFullYear();
        if(hoje < new Date(hoje.getFullYear(), n.getMonth(), n.getDate())) idade--;
        document.getElementById('idade').value = idade + " anos";
    }
}

function atualizarStatusVisual(tipo) {
    const st = document.getElementById(`status-${tipo}`);
    if(dadosRelatorio[tipo].texto && dadosRelatorio[tipo].texto.trim() !== "") { 
        st.innerHTML = `<i class="fas fa-check-circle"></i> OK`; 
        st.className = "status salvo"; 
    } else {
        st.innerHTML = "Pendente";
        st.className = "status pendente";
    }
}

/* === MODAL === */
function abrirModal(tipo) {
    modalAtual = tipo;
    const container = document.getElementById('container-checklist');
    const labelExtra = document.getElementById('labelExtra');
    labelExtra.innerText = tipo === 'pedagogica' ? "Indicações (Automático):" : "Encaminhamentos (Automático):";
    document.getElementById('modalTexto').value = dadosRelatorio[tipo].texto;
    document.getElementById('modalExtra').value = dadosRelatorio[tipo].extra;
    document.getElementById('modalTitulo').innerText = "Checklist: " + tipo.charAt(0).toUpperCase() + tipo.slice(1);
    container.innerHTML = "";
    const dados = CHECKLIST_DB[tipo];
    if(dados) {
        for(const [cat, itens] of Object.entries(dados)) {
            let html = `<div class="grupo-checklist"><h5>${cat}</h5>`;
            itens.forEach((it) => {
                const isChecked = dadosRelatorio[tipo].texto.includes(it.texto) ? 'checked' : '';
                html += `<div class="item-check"><input type="checkbox" ${isChecked} onchange="procCheck(this, '${it.texto}', '${it.indicacao||it.encam||''}')"><label>${it.label}</label></div>`;
            });
            container.innerHTML += html + "</div>";
        }
    }
    document.getElementById('modalOverlay').style.display = 'flex';
}

function procCheck(chk, txt, ext) {
    const t = document.getElementById('modalTexto'); 
    const e = document.getElementById('modalExtra');
    if(chk.checked) {
        if(!t.value.includes(txt)) t.value += (t.value ? "\n" : "") + txt;
        if(ext && !e.value.includes(ext)) e.value += (e.value ? "\n- " : "- ") + ext;
    } else {
        t.value = t.value.replace(txt, '').replace(/\n\n/g, '\n').trim();
        if(ext) e.value = e.value.replace("- " + ext, '').replace(/\n\n/g, '\n').trim();
    }
}

function salvarModal() {
    dadosRelatorio[modalAtual].texto = document.getElementById('modalTexto').value;
    dadosRelatorio[modalAtual].extra = document.getElementById('modalExtra').value;
    const inputOculto = document.getElementById(`texto-${modalAtual}`);
    if(inputOculto) {
        inputOculto.value = dadosRelatorio[modalAtual].texto;
        if(inputOculto.mirrorDiv) {
            inputOculto.mirrorDiv.innerText = dadosRelatorio[modalAtual].texto;
            ajustarAltura(inputOculto);
        }
    }
    atualizarStatusVisual(modalAtual);
    atualizarFinais();
    fecharModal();
}

function fecharModal() { document.getElementById('modalOverlay').style.display = 'none'; }

function atualizarFinais() {
    const ind = document.getElementById('final-indicacoes');
    if(dadosRelatorio.pedagogica.extra && (!ind.value || ind.value === dadosRelatorio.pedagogica.extra)) {
        ind.value = dadosRelatorio.pedagogica.extra; 
        if(ind.mirrorDiv) ind.mirrorDiv.innerText = ind.value;
    }
    let enc = "";
    if(dadosRelatorio.clinica.extra) enc += "SAÚDE:\n" + dadosRelatorio.clinica.extra + "\n";
    if(dadosRelatorio.social.extra) enc += "SOCIAL:\n" + dadosRelatorio.social.extra;
    const finEnc = document.getElementById('final-encaminhamentos');
    if(enc && finEnc.value.trim() === "") {
        finEnc.value = enc.trim();
        if(finEnc.mirrorDiv) finEnc.mirrorDiv.innerText = finEnc.value;
    }
}

function gerarConclusaoAutomatica() {
    const nome = document.getElementById('nomeEstudante').value || "O estudante";
    const p = dadosRelatorio.pedagogica.texto;
    const conc = document.getElementById('final-conclusao');
    if(!conc.value || confirm("O campo de conclusão já tem texto. Deseja sobrescrever?")) {
        conc.value = `CONCLUSÃO DIAGNÓSTICA:\n\nConsiderando o processo avaliativo, conclui-se que ${nome} apresenta necessidades educacionais específicas.\n\nNo aspecto Pedagógico: ${p.replace(/\n/g, ". ")}.`;
        if(conc.mirrorDiv) conc.mirrorDiv.innerText = conc.value;
        ajustarAltura(conc);
    }
}