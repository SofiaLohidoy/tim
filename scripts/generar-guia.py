"""Genera la guía PDF desde el mismo contenido que muestra la app.
Fuentes: Montserrat, https://github.com/JulietaUla/Montserrat (OFL junto a los TTF).
La información proviene exclusivamente del brief de Sofía del 27/10/2026.
"""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle, SimpleDocTemplate, Spacer, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
G = json.loads((ROOT/'src/lib/hackaton/guia.json').read_text(encoding='utf-8'))
pdfmetrics.registerFont(TTFont('Montserrat', str(ROOT/'public/fonts/Montserrat-Regular.ttf')))
pdfmetrics.registerFont(TTFont('MontserratBold', str(ROOT/'public/fonts/Montserrat-Bold.ttf')))
pdfmetrics.registerFontFamily('Montserrat',normal='Montserrat',bold='MontserratBold')
VERDE, OSCURO, VIOLETA, LILA, CLARO, CREMA = [colors.HexColor(x) for x in ['#17483F','#102E28','#8061EB','#AABCFA','#E8DFFF','#FAF8F4']]
BODY=ParagraphStyle('cuerpo',fontName='Montserrat',fontSize=9.1,leading=13,textColor=OSCURO,spaceAfter=5)
H=ParagraphStyle('titulo',parent=BODY,fontName='MontserratBold',fontSize=13,leading=17,spaceBefore=9,spaceAfter=7,textColor=VERDE)
SMALL=ParagraphStyle('pequeno',parent=BODY,fontSize=8,leading=11)
TITLE=ParagraphStyle('portada',parent=BODY,fontName='MontserratBold',fontSize=29,leading=35,textColor=VERDE)
def p(text,style=BODY): return Paragraph(escape(text),style)
def bloque(sec):
    rows=[p(sec['titulo'],H)]
    rows.extend(p(t) for t in sec.get('textos',[]))
    rows.extend(p('• '+t) for t in sec.get('items',[]))
    if sec.get('pendiente'):
        box=Table([[rows]],colWidths=[515]);box.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CLARO),('BOX',(0,0),(-1,-1),.5,LILA),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
        return [box,Spacer(1,8)]
    return [KeepTogether(rows),Spacer(1,4)]
def pie(c,doc):
    c.saveState();c.setFillColor(CREMA);c.rect(0,0,*A4,fill=1,stroke=0)
    c.setFillColor(VERDE);c.setFont('MontserratBold',9);c.drawString(40,25,'TIM · Tu capacidad, en evidencia.')
    c.setFont('Montserrat',8);c.drawRightString(A4[0]-40,25,f'{doc.page} / 2');c.restoreState()
story=[p('TIM',H),p(G['titulo'],TITLE),p(G['bajada']),Spacer(1,10)]
info=Table([[p('FECHA',SMALL),p('HORARIO',SMALL),p('LUGAR',SMALL)],[p(G['fecha']),p(G['horario']),p(G['lugar'])]],colWidths=[172,142,201])
info.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CLARO),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,0),10),('BOTTOMPADDING',(0,-1),(-1,-1),10)]))
story.extend([info,Spacer(1,8)])
for i,sec in enumerate(G['secciones'][:4]):
    story.extend(bloque(sec))
    if i==0:
        cells=[p(f'{n+1}. {text}',SMALL) for n,text in enumerate(G['recorrido'])]
        flow=Table([cells[:3],cells[3:]],colWidths=[171.7]*3)
        flow.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CLARO),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
        story.extend([flow,Spacer(1,8)])
story.extend([PageBreak(),p('Hackathon TIM · Tu guía',H)])
for sec in G['secciones'][4:]: story.extend(bloque(sec))
story.extend([Spacer(1,8),p(G['cierre'],H),p(G['firma'])])
out=ROOT/'public/documentos/bienvenida-hackathon-tim.pdf'
SimpleDocTemplate(str(out),pagesize=A4,rightMargin=40,leftMargin=40,topMargin=30,bottomMargin=45,title=G['titulo'],author='TIM').build(story,onFirstPage=pie,onLaterPages=pie)
print(out)
