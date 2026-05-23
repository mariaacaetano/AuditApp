import React, { useEffect, useState } from "react";
import { FileText, X, Download, Loader2, CheckSquare, Square, ListTree } from "lucide-react";

const BASE = "http://localhost:8000/controles";

function token() {
  return localStorage.getItem("access_token");
}

function auditLabel(auditoria) {
  return auditoria?.nome || `Auditoria #${auditoria?.id_auditoria || "-"}`;
}

/**
 * Modal para gerar relatório PDF.
 * Permite selecionar auditorias da mesma empresa/norma para incluir no comparativo.
 *
 * Props:
 *   auditoria       – auditoria atual { id_auditoria, empresa, norma, data_auditoria }
 *   gerando         – boolean vindo do hook useRelatorioPDF
 *   onGerar(selecionadas, tipoRelatorio) – callback chamado com lista de auditorias comparativas e tipo do PDF
 *   onFechar        – callback para fechar o modal
 */
export default function ModalRelatorioPDF({ auditoria, gerando, onGerar, onFechar }) {
  const [historico, setHistorico] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [tipoRelatorio, setTipoRelatorio] = useState("completo");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const buscarHistorico = async () => {
      setCarregando(true);
      setErro("");
      try {
        const resp = await fetch(`${BASE}/auditorias/view`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (!resp.ok) throw new Error();
        const lista = await resp.json();
        const atualNaLista = lista.find(item => String(item.id_auditoria) === String(auditoria.id_auditoria));
        const auditoriaBase = {
          ...(atualNaLista || {}),
          ...auditoria,
          empresa: auditoria.empresa ?? atualNaLista?.empresa,
          norma: auditoria.norma ?? atualNaLista?.norma,
        };

        const filtradas = lista
          .filter(item =>
            String(item.empresa || "").trim().toLowerCase() === String(auditoriaBase.empresa || "").trim().toLowerCase() &&
            String(item.norma || "").trim().toLowerCase() === String(auditoriaBase.norma || "").trim().toLowerCase() &&
            String(item.id_auditoria) !== String(auditoria.id_auditoria)
          )
          .sort((a, b) => {
            const d = new Date(b.data_auditoria || 0) - new Date(a.data_auditoria || 0);
            return d || Number(b.id_auditoria) - Number(a.id_auditoria);
          });

        setHistorico(filtradas);
      } catch {
        setErro("Não foi possível buscar o histórico de auditorias.");
      } finally {
        setCarregando(false);
      }
    };

    buscarHistorico();
  }, [auditoria.id_auditoria, auditoria.nome, auditoria.empresa, auditoria.norma]);

  function toggleSelecionada(item) {
    setSelecionadas(prev =>
      prev.find(a => a.id_auditoria === item.id_auditoria)
        ? prev.filter(a => a.id_auditoria !== item.id_auditoria)
        : [...prev, item]
    );
  }

  function handleGerar() {
    onGerar(selecionadas, tipoRelatorio);
  }

  return (
    <div className="relatorio-modal-overlay" onClick={onFechar}>
      <div className="relatorio-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relatorio-modal__header">
          <div className="relatorio-modal__header-info">
            <FileText size={18} />
            <div>
              <h2>Gerar Relatório PDF</h2>
              <p>{auditLabel(auditoria)} · {auditoria.empresa} · {auditoria.norma}</p>
            </div>
          </div>
          <button type="button" className="relatorio-modal__close" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        {/* Seção: tipo do relatório */}
        <div className="relatorio-modal__section">
          <h3>Tipo de relatório</h3>
          <div className="relatorio-modal__type-grid" role="radiogroup" aria-label="Tipo de relatório">
            <button
              type="button"
              className={tipoRelatorio === "completo" ? "relatorio-modal__type relatorio-modal__type--active" : "relatorio-modal__type"}
              onClick={() => setTipoRelatorio("completo")}
              aria-pressed={tipoRelatorio === "completo"}
            >
              <FileText size={16} />
              <span>
                <strong>Completo de conformidade</strong>
                <em>Resumo, distribuição e todos os controles respondidos.</em>
              </span>
            </button>
            <button
              type="button"
              className={tipoRelatorio === "caracteristicas" ? "relatorio-modal__type relatorio-modal__type--active" : "relatorio-modal__type"}
              onClick={() => setTipoRelatorio("caracteristicas")}
              aria-pressed={tipoRelatorio === "caracteristicas"}
            >
              <ListTree size={16} />
              <span>
                <strong>Por características da norma</strong>
                <em>27701: tipos e atributos. 27002: domínio, conceito, tema, capacidades, propriedade e tipos.</em>
              </span>
            </button>
          </div>
        </div>

        {/* Seção: auditoria atual */}
        <div className="relatorio-modal__section">
          <h3>Auditoria incluída</h3>
          <article className="relatorio-modal__card relatorio-modal__card--current">
            <span>Auditoria atual · {auditLabel(auditoria)}</span>
            <strong>{auditoria.data_auditoria || "Data não informada"}</strong>
          </article>
        </div>

        {/* Seção: comparativo opcional */}
        <div className="relatorio-modal__section">
          <h3>Incluir comparativo com auditorias anteriores <em>(opcional)</em></h3>

          {erro && <p className="relatorio-modal__erro">{erro}</p>}

          {carregando ? (
            <p className="relatorio-modal__empty">Buscando histórico...</p>
          ) : historico.length === 0 ? (
            <p className="relatorio-modal__empty">
              Nenhuma auditoria anterior encontrada para esta empresa e norma.
            </p>
          ) : (
            <ul className="relatorio-modal__lista">
              {historico.map(item => {
                const marcada = !!selecionadas.find(a => a.id_auditoria === item.id_auditoria);
                return (
                  <li key={item.id_auditoria}>
                    <button
                      type="button"
                      className={`relatorio-modal__item ${marcada ? "relatorio-modal__item--selecionado" : ""}`}
                      onClick={() => toggleSelecionada(item)}
                    >
                      <span className="relatorio-modal__item-check">
                        {marcada ? <CheckSquare size={16} /> : <Square size={16} />}
                      </span>
                      <span className="relatorio-modal__item-info">
                        <strong>{auditLabel(item)}</strong>
                        <em>{item.data_auditoria || "Data não informada"}</em>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="relatorio-modal__footer">
          <button type="button" className="relatorio-modal__btn-cancelar" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="button"
            className="relatorio-modal__btn-gerar"
            onClick={handleGerar}
            disabled={gerando}
          >
            {gerando ? (
              <>
                <Loader2 size={15} className="relatorio-modal__spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download size={15} />
                {selecionadas.length > 0
                  ? `Gerar com comparativo (${selecionadas.length})`
                  : "Gerar relatório"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
