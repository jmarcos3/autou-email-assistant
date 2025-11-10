import re
from typing import Literal

Category = Literal["Produtivo", "Improdutivo"]

STOPWORDS = {
    "a","o","os","as","de","do","da","dos","das","e","é","em","um","uma","para","por",
    "no","na","nos","nas","eu","você","vcs","ele","ela","eles","elas","que","com","se",
    "ao","à","às","aos","the","and","of","to","in","on","for","is","are","be","was"
}

PRODUCTIVE_HINTS = [
    "status","atualização","atualizacao","andamento","progresso","prazo","deadline",
    "erro","bug","falha","suporte","ticket","chamado","protocolo","acesso",
    "documento","anexo","arquivo","comprovante","fatura","nota","boleto","solicito",
    "poderiam","pode verificar","pode confirmar","aguardo retorno","pendente"
]

UNPRODUCTIVE_HINTS = [
    "feliz natal","boas festas","bom dia","boa tarde","boa noite","agradeço","obrigado",
    "parabéns","congratulations","felicidades","sem demanda","apenas informando"
]

def clean(text: str) -> str:
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text

def simple_classify(text: str) -> Category:
    t = clean(text)
    p_score = sum(1 for k in PRODUCTIVE_HINTS if k in t)
    u_score = sum(1 for k in UNPRODUCTIVE_HINTS if k in t)
    if "?" in t or "favor" in t or "solicito" in t:
        p_score += 1
    return "Produtivo" if p_score >= u_score else "Improdutivo"

def suggest_reply(category: Category, text: str) -> str:
    if category == "Produtivo":
        return (
            "Olá! Recebemos sua mensagem. Estamos verificando seu pedido e retornamos com uma atualização "
            "ou confirmação até o fim do dia útil. Se precisar, responda a este e-mail com mais detalhes "
            "ou anexos relevantes. Obrigado!"
        )
    return (
        "Olá! Obrigado pela mensagem. Registramos seu contato. Caso precise de suporte ou uma ação específica, "
        "por favor detalhe sua solicitação respondendo este e-mail."
    )
