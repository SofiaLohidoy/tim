"""Guía y enlaces compartidos con la web. Contenido aprobado por Sofía, 29/10/2026.
Montserrat: https://github.com/JulietaUla/Montserrat (licencia OFL junto a los TTF).
"""
import json
import sys
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle, SimpleDocTemplate, Spacer, PageBreak, KeepTogether, Image, Flowable
ROOT=Path(__file__).resolve().parents[1]
def datos(nombre): return json.loads((ROOT/f'src/lib/hackaton/{nombre}.json').read_text(encoding='utf-8'))
G=datos('guia'); EMPRESAS=datos('empresas'); PERSONAS=datos('personas')
pdfmetrics.registerFont(TTFont('Montserrat',str(ROOT/'public/fonts/Montserrat-Regular.ttf')))
pdfmetrics.registerFont(TTFont('MontserratBold',str(ROOT/'public/fonts/Montserrat-Bold.ttf')))
pdfmetrics.registerFontFamily('Montserrat',normal='Montserrat',bold='MontserratBold')
VERDE,OSCURO,VIOLETA,LILA,CLARO,CREMA=[colors.HexColor(x) for x in ['#17483F','#102E28','#8061EB','#AABCFA','#E8DFFF','#FAF8F4']]
BODY=ParagraphStyle('cuerpo',fontName='Montserrat',fontSize=9,leading=12.5,textColor=OSCURO,spaceAfter=4)
H=ParagraphStyle('titulo',parent=BODY,fontName='MontserratBold',fontSize=13,leading=17,spaceBefore=9,spaceAfter=6,textColor=VERDE)
SMALL=ParagraphStyle('pequeno',parent=BODY,fontSize=7.5,leading=10)
NAME=ParagraphStyle('nombre',parent=SMALL,fontName='MontserratBold',fontSize=9,leading=12)
TITLE=ParagraphStyle('portada',parent=BODY,fontName='MontserratBold',fontSize=29,leading=35,textColor=VERDE)
def p(text,style=BODY): return Paragraph(escape(text),style)
def enlace(text,url,style=BODY): return Paragraph(f'<link href="{escape(url)}" color="#17483F">{escape(text)}</link>',style)
def imagen(path,size=36):
    path=ROOT/'public'/path.lstrip('/')
    w,h=ImageReader(str(path)).getSize();scale=size/max(w,h)
    return Image(str(path),width=w*scale,height=h*scale)
class Iniciales(Flowable):
    def __init__(self,nombre):
        Flowable.__init__(self);self.width=36;self.height=36;self.text=''.join(t[0] for t in nombre.split()[:2])
    def draw(self):
        self.canv.setFillColor(VERDE);self.canv.circle(18,18,17,fill=1,stroke=0)
        self.canv.setFillColor(CREMA);self.canv.setFont('MontserratBold',10);self.canv.drawCentredString(18,14,self.text)
def tarjetas_personas(personas):
    rows=[]
    for persona in personas:
        avatar=imagen(persona['foto']) if persona.get('foto') else Iniciales(persona['nombre'])
        rows.append([avatar,[enlace(persona['nombre'],persona['linkedin'],NAME),enlace('Ver perfil en LinkedIn',persona['linkedin'],SMALL)]])
    tabla=Table(rows,colWidths=[46,469])
    tabla.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CLARO),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LINEBELOW',(0,0),(-1,-2),2,CREMA)]))
    return tabla
def empresas():
    celdas=[]
    for empresa in EMPRESAS:
        url='https://tim-alpha-eight.vercel.app'+empresa['documento'] if empresa.get('documento') else None
        nombre=enlace(empresa['nombre'],url,NAME) if url else p(empresa['nombre'],NAME)
        estado=enlace('Ver documento (PDF)',url,SMALL) if url else p('Documento próximamente',SMALL)
        card=Table([[imagen(empresa['logo']),[nombre,estado]]],colWidths=[45,121])
        card.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CLARO),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),3)]))
        celdas.append(card)
    celdas.append('')
    tabla=Table([celdas[:3],celdas[3:]],colWidths=[171.7]*3)
    tabla.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    return tabla
def bloque(sec):
    rows=[p(sec['titulo'],H)]
    rows.extend(p(t) for t in sec.get('textos',[]))
    rows.extend(p('• '+t) for t in sec.get('items',[]))
    return [KeepTogether(rows),Spacer(1,3)]
def pie(c,doc):
    c.saveState();c.setFillColor(CREMA);c.rect(0,0,*A4,fill=1,stroke=0)
    c.setFillColor(VERDE);c.setFont('MontserratBold',9);c.drawString(40,25,'TIM · Tu capacidad, en evidencia.')
    c.setFont('Montserrat',8);c.drawRightString(A4[0]-40,25,str(doc.page));c.restoreState()
story=[p('TIM',H),p(G['titulo'],TITLE),p(G['bajada']),Spacer(1,10)]
info=Table([[p('FECHA',SMALL),p('HORARIO',SMALL),p('LUGAR',SMALL)],[p(G['fecha']),p(G['horario']),p(G['lugar'])]],colWidths=[172,142,201])
info.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CLARO),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,0),10),('BOTTOMPADDING',(0,-1),(-1,-1),10)]))
story.extend([info,Spacer(1,8)])
for sec in G['secciones']:
    titulo=sec['titulo']
    if titulo=='Sobre los mentores':story.extend([PageBreak(),p('Hackathon TIM · Tu guía',H)])
    if titulo=='Empresas participantes':
        if '--completa' in sys.argv: story.extend([p(titulo,H),empresas()])
        continue
    story.extend(bloque(sec))
    if titulo=='Cronograma del evento':
        cells=[p(f'{n+1}. {text}',SMALL) for n,text in enumerate(G['recorrido'])]
        flow=Table([cells[:3],cells[3:]],colWidths=[171.7]*3)
        flow.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CLARO),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
        story.extend([flow,Spacer(1,6)])
    if titulo=='Sobre los mentores':story.append(tarjetas_personas(PERSONAS['mentores']))
    if titulo=='Sobre el jurado':story.append(tarjetas_personas(PERSONAS['jurados']))
story.extend([Spacer(1,6),p(G['cierre'],H),p(G['firma'])])
out=ROOT/('src/contenidos/hackaton/bienvenida-completa.pdf' if '--completa' in sys.argv else 'public/documentos/bienvenida-hackathon-tim.pdf')
SimpleDocTemplate(str(out),pagesize=A4,rightMargin=40,leftMargin=40,topMargin=28,bottomMargin=45,title=G['titulo'],author='TIM').build(story,onFirstPage=pie,onLaterPages=pie)
print(out)
