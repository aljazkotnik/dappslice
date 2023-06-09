# -*- coding: utf-8 -*-
"""
Write a script that reads in Demetrios' data and splits it up into small files 
to be used with 
"""

import json
import csv
import os


def jsonwrite(folder, filename, data):
    with open(os.path.join(folder,filename), 'w') as f:
        json.dump(data, f)

def csvwrite(folder, filename, headers, data):
  with open(os.path.join(folder,filename), 'w', newline='') as fp:
    writer = csv.writer(fp, delimiter=',')
    writer.writerow(headers)
    for row in data:
      writer.writerow(row)

def json2csv(d, fields):
    csv = []
    for case in d:
        v = []
        for field in fields:
            v.append(case[field])  
        csv.append(v)
    return csv

def zipper(d, xname, yname):
    return [[d[xname][i], d[yname][i]] for i,x in enumerate(d[xname])]

def reverse(d):
    d.reverse()
    return d


def reformatContourData(t):
    # The data in the original json file is in a Matlab format which needs to 
    # be adjusted here for ease of plotting later on.
    
    passage0 = matlabContour2drawLines( t["contour"]["C"] )
    passage1 = matlabContour2drawLines( t["contour"]["C_pitch"] )
        
    flow_lines = passage0 + passage1
        
    for line in flow_lines:
        line['color'] = "cornflowerblue"
        if line["level"]==1:
            # line['color'] = "seagreen"
            line['lineWidth'] = 4
            
    custom_lines = [
        {"level": "aerofoil", "points": t["contour"]["xrt"], "color": "black"},
        {"level": "aerofoil", "points": t["contour"]["xrt_neg_pitch"], "color": "black"},
        {"level": "aerofoil", "points": t["contour"]["xrt_pos_pitch"], "color": "black"},
            
        {"level": "throat_bl", "points": t["contour"]["xrt_throat_bl"], "color": "magenta"},
        {"level": "stag_line", "points": t["contour"]["xrt_stag_line"], "color": "gray"},
        {"level": "is_line", "points": t["contour"]["xrt_is"], "color": "magenta"},
        {"level": "bl", "points": t["contour"]["bl"], "color": "gray"}
    ]        
    
    return flow_lines + custom_lines
    

def matlabContour2drawLines(C):
    # Loop through the 2D matlab contour array, and turn it into individual lines
    lines = []
    
    # {level: <scalar>, points: [...]}
    
    # Loop over all the columns, and decode accordingly.
    current_n = 0;
    for i,v in enumerate(C[0]):
        if(current_n == 0):
            # All hte points for this level have been collected. Start new line.
            currentline = {"level": C[0][i], "points": []}
            current_n = C[1][i]
            lines.append(currentline)
        else:
            # Add the current point to the current line
            lines[-1]["points"].append( [ C[0][i], C[1][i] ] )
            current_n -= 1
    
    return lines

def contourextent(C):
    # Loop through all of the lines and calculate the overall extent.
    xvals = []
    yvals = []
    
    def getx(p): return p[0]
    def gety(p): return p[1]
    
    for line in C:
        xvals.append( min( map(getx, line["points"]) ) )
        xvals.append( max( map(getx, line["points"]) ) )
        yvals.append( min( map(gety, line["points"]) ) )
        yvals.append( max( map(gety, line["points"]) ) )

    return [[min(xvals), max(xvals)], [min(yvals), max(yvals)]]




root = "C:\\Users\\Aljaz\\Documents\\CAMBRIDGE\\PhD\\github_repos\\dbslice\\demos\\dapp\\data"


with open(".//rawdata//M95A60SC80TC4_psi040A95_load_coef.json") as f:
  data = json.load(f)

  M = []
  # Now parcel the data out in separate files. Store the filelocations in the
  # metadata. Collect the general metadata in a single file.
  for case in data:
    
    # Create a folder for each case and save the files into it.
    folder = os.path.join(root, case["metadata"]["name"][0]);
    if not os.path.exists(folder):
      os.makedirs(folder)
    

    
    # Camber.
    # keys are: ['camber', 's_cam', 'theta_ss', 's_ss', 'theta_ps', 's_ps']
    # s_cam and camber need to be merged into a series, which will then be used.
    c = zipper(case["camber"], "s_cam", "camber")
    csvwrite(folder, "camber.csv", ["x", "y"], c)
    
    
    # Mach
    m1 = zipper( case["distribution"], "s_1", "Mis_1" )
    m2 = zipper( case["distribution"], "s_2", "Mis_2"  )
    csvwrite(folder, "mach.csv", ["x", "y"], m1 + reverse(m2))
    
    
    # Theta
    t1 = zipper( case["camber"], "s_ps", "theta_ps" )
    t2 = zipper( case["camber"], "s_ss", "theta_ss" )
    csvwrite(folder, "theta.csv", ["x", "y"], t1 + reverse(t2))
    
    
    # Contours
    # Contours I want to write as a json file.
    contourlines = reformatContourData(case);
    contourdata = {
        "lines": contourlines,
        "extent": contourextent( contourlines )
     }
    jsonwrite(folder, "contour.json", contourdata)
    
    
    # icons still need to have plots developed for them, therefore
    # aren't tackled here yet.
    
    
    
    # Now store the metadata for dbslice.
    m = case["metadata"]
    m["name"] = m["name"][0]
    m["dr"] = m["dr"][0]
    m["taskId"] = m["name"]
    m["label"] = m["name"]
    M.append(case["metadata"])
    
    
    
  # fields = ['name', 'AtA1', 'AtA1_area', 'AtA1_area_bl', 'AtA1_rhoV', 'AtA1_P', 
  #           'AtA1_bl', 'AtA1_rhoV_bl', 'AtA1_P_bl', 'Yp', 'Yp_fr', 'dPo_Po', 
  #           'AtD', 'rad_contr', 'inc', 'M_max', 's_max', 'P_throat_area_avg', 
  #           'P', 'P_area', 'P_is', 'P_is_rhoV', 'P_throat_area_avg_bl', 'P_bl', 
  #           'P_area_bl', 'P_is_bl', 'P_is_rhoV_bl', 'dr', 'taskId', 'label']
  fields = case["metadata"].keys()
  csvmetadata = json2csv(M, fields)  
  csvwrite(root, "metadata.csv", fields, csvmetadata)
  